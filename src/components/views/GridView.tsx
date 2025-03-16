import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Settings, Plus, ChevronRight, Layers } from 'lucide-react';
import { TaskCard } from '../TaskCard';
import { cn, QUADRANT_COLORS } from '../../lib/utils';
import type { Task, Section, ViewProps } from '../../types/app';

interface TaskGroupsProps {
  tasks: Task[];
  sections: Section[];
  collapsedSections: Set<string>;
  onToggleSection: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleComplete?: (id: string, completed: boolean) => Promise<void>;
  onChangeSection?: (id: string, sectionId: string | null) => Promise<void>;
  onEdit?: (task: Task) => void;
}

function TaskGroups({ 
  tasks, 
  sections, 
  collapsedSections, 
  onToggleSection, 
  onDelete,
  onToggleComplete,
  onChangeSection,
  onEdit
}: TaskGroupsProps) {
  // Group tasks by section
  const sectionTasks = sections.map(section => ({
    section,
    tasks: tasks.filter(task => task.section_id === section.id)
  })).filter(group => group.tasks.length > 0);

  // Get unsectioned tasks
  const unsectionedTasks = tasks.filter(task => !task.section_id);

  return (
    <>
      {sectionTasks.map(({ section, tasks }) => (
        <div key={section.id} className="mb-4">
          <button
            onClick={() => onToggleSection(section.id)}
            className="w-full text-left text-sm font-medium text-gray-600 mb-2 flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
          >
            <ChevronRight
              size={14}
              className={cn(
                "text-gray-400 transition-transform",
                !collapsedSections.has(section.id) && "rotate-90"
              )}
            />
            <Layers size={14} className="text-gray-400" />
            <span className="flex-1">{section.name}</span>
            <span className="text-xs text-gray-400">
              ({tasks.length})
            </span>
          </button>
          <div className={cn(
            "transition-all duration-200 ease-in-out",
            collapsedSections.has(section.id) ? "h-0 overflow-hidden opacity-0" : "opacity-100"
          )}>
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onDelete={onDelete}
                onToggleComplete={onToggleComplete}
                onChangeSection={onChangeSection}
                onEdit={onEdit}
              />
            ))}
          </div>
        </div>
      ))}
      {unsectionedTasks.map((task, index) => (
        <TaskCard
          key={task.id}
          task={task}
          index={index}
          onDelete={onDelete}
          onToggleComplete={onToggleComplete}
          onChangeSection={onChangeSection}
          onEdit={onEdit}
        />
      ))}
    </>
  );
}

export function GridView({ 
  quadrants,
  sections,
  collapsedSections,
  onDragEnd,
  onDelete,
  onToggleSection,
  onOpenTaskForm,
  onOpenSectionManager,
  onToggleComplete,
  onChangeTaskSection,
  onEditTask
}: ViewProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quadrants.map(({ id, name, tasks }) => (
          <div
            key={id}
            className={`p-4 rounded-lg border-2 ${QUADRANT_COLORS[id]}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{name}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenSectionManager}
                  className="p-2 rounded-full hover:bg-white/50 transition-colors"
                >
                  <Settings size={20} />
                </button>
                <button
                  onClick={() => onOpenTaskForm(id)}
                  className="p-2 rounded-full hover:bg-white/50 transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <Droppable droppableId={String(id)}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="min-h-[200px]"
                >
                  <TaskGroups
                    tasks={tasks}
                    sections={sections}
                    collapsedSections={collapsedSections}
                    onToggleSection={onToggleSection}
                    onDelete={onDelete}
                    onToggleComplete={onToggleComplete}
                    onChangeSection={onChangeTaskSection}
                    onEdit={onEditTask}
                  />
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}