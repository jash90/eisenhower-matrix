import { useState, useEffect, useCallback } from 'react';
import { DropResult } from '@hello-pangea/dnd';
import { supabase, createRobustChannel } from '../lib/supabase';
import { requestNotificationPermission, checkTaskNotifications } from '../lib/notifications';
import { cn, QUADRANT_NAMES, QUADRANT_COLORS } from '../lib/utils';
import { TaskForm } from './TaskForm';
import { Grid, List, Search, Layers, Plus, X, GripVertical, AlertTriangle, Settings, Smartphone } from 'lucide-react';
import { AdUnit } from './AdUnit';
import { GridView } from './views/GridView';
import { ListView } from './views/ListView';
import { SectionsView } from './views/SectionsView';
import type { Task, Section } from '../types/app';

export function Matrix() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeQuadrant, setActiveQuadrant] = useState<number | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [managingSections, setManagingSections] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'sections'>('grid');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  
  // Section manager state
  const [newSectionName, setNewSectionName] = useState('');
  const [sectionLoading, setSectionLoading] = useState(false);
  const [sectionError, setSectionError] = useState<string | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);

  // Request notification permission when component mounts
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Check for due tasks every minute
  useEffect(() => {
    const interval = setInterval(() => {
      // Check immediately
      checkTaskNotifications(tasks);
    }, 15000); // Check every 15 seconds for more responsive notifications

    return () => clearInterval(interval);
  }, [tasks]);

  // Memoize functions that don't change to prevent unnecessary re-renders
  const updateTaskLocally = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    );
  }, []);

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const handleOpenTaskForm = useCallback((quadrantId: number) => {
    setActiveQuadrant(quadrantId);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setTaskToEdit(task);
  }, []);

  // Memoize fetch functions to prevent unnecessary re-renders
  const fetchSections = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .order('order', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        return;
      }
      setSections(data || []);
    } catch (err) {
      console.error('Error fetching sections:', err);
      // Add retry after 1 second
      setTimeout(fetchSections, 1000);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data as Task[] || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Section Management Functions
  const handleAddSection = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;

    setSectionLoading(true);
    setSectionError(null);

    // Create temporary ID for optimistic UI
    const tempId = `temp-${Date.now()}`;
    
    // Create new section for optimistic update
    const newSection = {
      ...(sections[0] || {}), // Use an existing section as template if available
      id: tempId,
      name: newSectionName.trim(),
      order: sections.length,
      created_at: new Date().toISOString()
    } as Section;

    // Optimistic update
    setSections(prev => [...prev, newSection]);
    setNewSectionName('');

    try {
      const { data, error } = await supabase.from('sections').insert({
        name: newSectionName.trim(),
        order: sections.length,
      }).select();

      if (error) {
        // Revert optimistic update on error
        setSections(prev => prev.filter(section => section.id !== tempId));
        throw error;
      }
      
      // Update with actual server data
      if (data && data.length > 0) {
        setSections(prevSections => 
          prevSections.map(section => 
            section.id === tempId ? data[0] : section
          )
        );
      }
    } catch (err) {
      setSectionError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSectionLoading(false);
    }
  }, [newSectionName, sections]);

  const handleDeleteSection = useCallback(async (id: string) => {
    setSectionToDelete(null);
    
    // Store original sections for potential rollback
    const originalSections = [...sections];
    
    // Optimistically remove the section
    setSections(prev => prev.filter(section => section.id !== id));
    
    try {
      const { error } = await supabase.from('sections').delete().eq('id', id);
      
      if (error) {
        // Rollback on error
        setSections(originalSections);
        throw error;
      }
    } catch (err) {
      console.error('Error deleting section:', err);
      setSectionError(err instanceof Error ? err.message : 'Failed to delete section');
    }
  }, [sections]);

  // Function to handle changing a task's section with optimistic updates
  const changeTaskSection = useCallback(async (taskId: string, sectionId: string | null) => {
    // Find the task to update
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (!taskToUpdate) return;

    // Store original section for rollback
    const originalSectionId = taskToUpdate.section_id;

    // Optimistically update the UI
    updateTaskLocally(taskId, { section_id: sectionId });

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ section_id: sectionId })
        .eq('id', taskId);

      if (error) {
        // Rollback on error
        updateTaskLocally(taskId, { section_id: originalSectionId });
        throw error;
      } else {
        // Ensure both tasks and sections remain in sync
        await fetchTasks();
        // Explicitly fetch sections to ensure data is up-to-date
        await fetchSections();
      }
    } catch (err) {
      console.error('Error updating task section:', err);
    }
  }, [tasks, updateTaskLocally, fetchTasks, fetchSections]);

  // Moved toggleComplete inside the component and added optimistic updates
  const toggleComplete = useCallback(async (id: string, completed: boolean) => {
    // Optimistically update the UI
    updateTaskLocally(id, { completed });

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', id);

      if (error) {
        // Rollback on error
        updateTaskLocally(id, { completed: !completed });
        throw error;
      }
    } catch (err) {
      console.error('Error updating task completion status:', err);
    }
  }, [updateTaskLocally]);

  // Set up real-time subscriptions
  useEffect(() => {
    // Initial data fetch
    fetchTasks();
    fetchSections();

    let tasksChannel: RealtimeChannel;
    let sectionsChannel: RealtimeChannel;

    async function setupChannels() {
      try {
        // Set up tasks channel
        tasksChannel = await createRobustChannel('tasks-changes', {
          onInsert: () => fetchTasks(),
          onUpdate: (payload) => {
            fetchTasks();
            if (payload.new && payload.old && payload.new.section_id !== payload.old.section_id) {
              fetchSections();
            }
          },
          onDelete: () => fetchTasks(),
          onError: (error) => console.error('Tasks channel error:', error)
        });

        // Set up sections channel
        sectionsChannel = await createRobustChannel('sections-changes', {
          onInsert: () => {
            fetchSections();
            fetchTasks();
          },
          onUpdate: () => {
            fetchSections();
            fetchTasks();
          },
          onDelete: () => {
            fetchSections();
            fetchTasks();
          },
          onError: (error) => console.error('Sections channel error:', error)
        });
      } catch (error) {
        console.error('Error setting up realtime channels:', error);
      }
    }

    setupChannels();

    // Cleanup function
    return () => {
      if (tasksChannel) {
        supabase.removeChannel(tasksChannel);
      }
      if (sectionsChannel) {
        supabase.removeChannel(sectionsChannel);
      }
    };
  }, [fetchTasks, fetchSections]);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination) return;

    const sourceQuadrant = parseInt(result.source.droppableId);
    const destinationQuadrant = parseInt(result.destination.droppableId);

    if (sourceQuadrant === destinationQuadrant) return;

    const taskId = result.draggableId;

    // Optimistically update the UI
    updateTaskLocally(taskId, { quadrant: destinationQuadrant });

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ quadrant: destinationQuadrant })
        .eq('id', taskId);

      if (error) {
        // Rollback on error
        updateTaskLocally(taskId, { quadrant: sourceQuadrant });
        throw error;
      }
    } catch (err) {
      console.error('Error updating task quadrant:', err);
    }
  }, [updateTaskLocally]);

  const handleDelete = useCallback(async (id: string) => {
    // Store the task before removal for potential rollback
    const deletedTask = tasks.find(t => t.id === id);

    // Optimistically remove the task from UI
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) {
        // Rollback on error
        if (deletedTask) {
          setTasks(prevTasks => [...prevTasks, deletedTask]);
        }
        throw error;
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  }, [tasks]);

  // Create filtered tasks list
  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(search.toLowerCase())
  );

  // Create quadrants array with filtered tasks
  const quadrants = [1, 2, 3, 4].map((quadrant) => ({
    id: quadrant,
    name: QUADRANT_NAMES[quadrant as keyof typeof QUADRANT_NAMES],
    tasks: filteredTasks.filter((task) => task.quadrant === quadrant),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  const viewProps = {
    quadrants,
    sections,
    filteredTasks,
    collapsedSections,
    fetchTasks,
    onDragEnd: handleDragEnd,
    onDelete: handleDelete,
    onToggleSection: toggleSection,
    onOpenTaskForm: handleOpenTaskForm,
    onOpenSectionManager: () => setManagingSections(true),
    onToggleComplete: toggleComplete,
    onChangeTaskSection: changeTaskSection,
    onEditTask: handleEditTask
  };

  // Section Manager Modal Component - Integrated within Matrix
  function SectionManagerModal() {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Manage Sections</h3>
            <button
              onClick={() => setManagingSections(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          {sectionError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {sectionError}
            </div>
          )}

          <form onSubmit={handleAddSection} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="New section name"
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <button
                type="submit"
                disabled={sectionLoading || !newSectionName.trim()}
                className={cn(
                  'px-4 py-2 rounded-md text-white',
                  sectionLoading || !newSectionName.trim()
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                )}
              >
                <Plus size={20} />
              </button>
            </div>
          </form>

          {sectionToDelete && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-500 shrink-0" size={20} />
                <div className="flex-1">
                  <h4 className="font-medium text-red-800 mb-1">
                    Delete Section?
                  </h4>
                  <p className="text-sm text-red-600 mb-3">
                    All tasks in this section will be moved to "Unsectioned Tasks". This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteSection(sectionToDelete)}
                      className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setSectionToDelete(null)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {sections.map((section) => (
              <div
                key={section.id}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded-md"
              >
                <GripVertical size={20} className="text-gray-400" />
                <span className="flex-1">{section.name}</span>
                <button
                  onClick={() => setSectionToDelete(section.id)}
                  className="p-1 hover:bg-gray-200 rounded-full text-gray-500 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <AdUnit 
        slot="0987654321"
        className="mb-6 bg-white rounded-lg shadow-sm p-4"
        format="horizontal"
      />
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2 bg-white rounded-lg border p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('p-2 rounded-md transition-colors', {
                'bg-gray-100': viewMode === 'grid',
                'hover:bg-gray-50': viewMode !== 'grid'
              })}
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-2 rounded-md transition-colors', {
                'bg-gray-100': viewMode === 'list',
                'hover:bg-gray-50': viewMode !== 'list'
              })}
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setViewMode('sections')}
              className={cn('p-2 rounded-md transition-colors', {
                'bg-gray-100': viewMode === 'sections',
                'hover:bg-gray-50': viewMode !== 'sections'
              })}
            >
              <Layers size={20} />
            </button>
          </div>
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
          <button
            onClick={() => setManagingSections(true)}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Manage Sections"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={() => window.open('/widget-preview.html', '_blank')}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Add Widget"
          >
            <Smartphone size={20} />
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <ListView {...viewProps} />
      ) : viewMode === 'sections' ? (
        <SectionsView {...viewProps} />
      ) : (
        <GridView {...viewProps} />
      )}

      {(activeQuadrant || taskToEdit) && (
        <TaskForm
          quadrant={taskToEdit?.quadrant || activeQuadrant!}
          task={taskToEdit}
          onClose={() => {
            setActiveQuadrant(null);
            setTaskToEdit(null);
          }}
          onSuccess={fetchTasks}
        />
      )}

      {managingSections && <SectionManagerModal />}
    </div>
  );
}