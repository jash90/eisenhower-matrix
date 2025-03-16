import { cn } from '../../lib/utils';
import { TaskListItem } from '../TaskListItem';
import { ChevronRight } from 'lucide-react';
import type { ViewProps, Task, Section } from '../../types/app';

interface UnsectionedTasksProps {
  tasks: Task[];
  sections: Section[];
  onDelete: (id: string) => void;
  onToggleComplete?: (id: string, completed: boolean) => Promise<void>;
  onEdit?: (task: Task) => void;
}

function UnsectionedTasks({ tasks, sections, onDelete, onToggleComplete, onEdit }: UnsectionedTasksProps) {
  if (tasks.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b">
        <h2 className="text-lg font-semibold text-gray-700">
          Unsectioned Tasks
        </h2>
      </div>
      <div className="divide-y">
        {tasks.map((task) => (
          <TaskListItem
            key={task.id}
            task={task}
            sections={sections}
            onDelete={onDelete}
            onToggleComplete={onToggleComplete}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}

export function SectionsView({ 
  sections,
  filteredTasks,
  collapsedSections,
  fetchTasks,
  onToggleSection,
  onDelete,
  onToggleComplete,
  onEditTask,
}: ViewProps) {
  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const sectionTasks = filteredTasks.filter(
          (task) => task.section_id === section.id
        );
        return sectionTasks.length > 0 && (
          <div key={section.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <button
                onClick={() => onToggleSection(section.id)}
                className="w-full flex items-center gap-2 text-left"
              >
                <ChevronRight
                  size={16}
                  className={cn(
                    "text-gray-400 transition-transform",
                    !collapsedSections.has(section.id) && "rotate-90"
                  )}
                />
                <h2 className="text-lg font-semibold text-gray-700 flex-1">
                  {section.name}
                </h2>
                <span className="text-sm text-gray-500">
                  ({sectionTasks.length})
                </span>
              </button>
            </div>
            <div className={cn(
              "divide-y transition-all duration-200 ease-in-out",
              collapsedSections.has(section.id) ? "h-0 overflow-hidden opacity-0" : "opacity-100"
            )}>
              {sectionTasks.map((task) => (
                <TaskListItem
                  key={task.id}
                  task={task}
                  sections={sections}
                  onDelete={onDelete}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEditTask}
                />
              ))}
            </div>
          </div>
        );
      })}
      <UnsectionedTasks
        tasks={filteredTasks.filter(task => !task.section_id)}
        sections={sections}
        onDelete={onDelete}
        onToggleComplete={onToggleComplete}
        onEdit={onEditTask}
      />
    </div>
  );
}