import { useState, useEffect } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { cn, QUADRANT_COLORS } from '../lib/utils';
import { Calendar, Check, Layers, Trash2, Clock, Edit2 } from 'lucide-react';
import type { Database } from '../types/supabase';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    completed: boolean;
    section_id: string | null;
    quadrant: number;
  };
  index: number;
  onDelete: (id: string) => void;
  onToggleComplete?: (id: string, completed: boolean) => Promise<void>;
  onChangeSection?: (id: string, sectionId: string | null) => Promise<void>;
  onEdit?: (task: Task) => void;
}

export function TaskCard({ task, index, onDelete, onToggleComplete, onChangeSection, onEdit }: TaskCardProps) {
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<Database['public']['Tables']['sections']['Row'][]>([]);
  const [showSectionSelect, setShowSectionSelect] = useState(false);
  const [optimisticCompleted, setOptimisticCompleted] = useState(task.completed);
  const [optimisticSectionId, setOptimisticSectionId] = useState(task.section_id);

  useEffect(() => {
    fetchSections();
  }, []);

  useEffect(() => {
    setOptimisticCompleted(task.completed);
  }, [task.completed]);

  useEffect(() => {
    setOptimisticSectionId(task.section_id);
  }, [task.section_id]);

  async function fetchSections() {
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
  }

  async function toggleComplete() {
    if (!onToggleComplete || loading) return;
    
    setLoading(true);
    const newCompleted = !optimisticCompleted;
    setOptimisticCompleted(newCompleted);

    try {
      await onToggleComplete(task.id, newCompleted);
    } catch (err) {
      // Rollback on error
      setOptimisticCompleted(!newCompleted);
      console.error('Error updating task:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSectionChange(sectionId: string | null) {
    if (!onChangeSection || loading) return;

    setLoading(true);
    const previousSectionId = optimisticSectionId;
    setOptimisticSectionId(sectionId);
    setShowSectionSelect(false);

    try {
      await onChangeSection(task.id, sectionId);
    } catch (err) {
      // Rollback on error
      setOptimisticSectionId(previousSectionId);
      setShowSectionSelect(true);
      console.error('Error updating task section:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            'p-4 rounded-lg border-2 mb-2 bg-white shadow-sm hover:shadow transition-shadow',
            QUADRANT_COLORS[task.quadrant],
            optimisticCompleted && 'opacity-50'
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3
                className={cn(
                  'font-medium',
                  optimisticCompleted && 'line-through text-gray-500'
                )}
              >
                {task.title}
              </h3>
              {task.description && (
                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
              )}
              {task.due_date && (
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                  <Calendar size={14} />
                  {format(new Date(task.due_date), 'PPp')}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={() => onEdit(task)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-500"
                >
                  <Edit2 size={18} />
                </button>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowSectionSelect(!showSectionSelect)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <Layers size={18} />
                </button>
                {showSectionSelect && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 py-1">
                    <button
                      onClick={() => handleSectionChange(null)}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm hover:bg-gray-100',
                        !optimisticSectionId && 'text-blue-600'
                      )}
                    >
                      No Section
                    </button>
                    {sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => handleSectionChange(section.id)}
                        className={cn(
                          'w-full px-4 py-2 text-left text-sm hover:bg-gray-100',
                          optimisticSectionId === section.id && 'text-blue-600'
                        )}
                      >
                        {section.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={toggleComplete}
                disabled={loading}
                className="p-1 rounded hover:bg-gray-100 relative"
              >
                {loading ? (
                  <Clock className="animate-spin text-gray-400" size={18} />
                ) : (
                  <Check
                    size={18}
                    className={cn(
                      optimisticCompleted ? 'text-green-500' : 'text-gray-400'
                    )}
                  />
                )}
              </button>
              <button
                onClick={() => onDelete(task.id)}
                disabled={loading}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}