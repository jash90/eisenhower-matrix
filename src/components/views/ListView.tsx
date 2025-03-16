import { Plus } from 'lucide-react';
import { cn, QUADRANT_TEXT_COLORS, TASK_SECTIONS, getTaskSection } from '../../lib/utils';
import { TaskListItem } from '../TaskListItem';
import type { ViewProps } from '../../types/app';

export function ListView({ 
  quadrants,
  sections,
  onDelete,
  onToggleComplete,
  onEditTask,
  onOpenTaskForm,
}: ViewProps) {
  return (
    <div className="space-y-4">
      {quadrants.map(({ id, name, tasks }) => tasks.length > 0 && (
        <div key={id} className="bg-white rounded-lg shadow-sm">
          <div className="px-4 py-3 border-b">
            <div className="flex items-center justify-between">
              <h2 className={cn('text-lg font-semibold', QUADRANT_TEXT_COLORS[id])}>
                {name}
              </h2>
              <button
                onClick={() => onOpenTaskForm(id)}
                className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
          {Object.entries(
            tasks.reduce((acc, task) => {
              const section = getTaskSection(task.due_date);
              if (!acc[section]) acc[section] = [];
              acc[section].push(task);
              return acc;
            }, {} as Record<keyof typeof TASK_SECTIONS, Task[]>)
          ).map(([section, sectionTasks]) => 
            sectionTasks.length > 0 && (
              <div key={section}>
                <h3 className="text-sm font-medium text-gray-500 px-4 py-2 bg-gray-50">
                  {TASK_SECTIONS[section as keyof typeof TASK_SECTIONS]}
                </h3>
                <div className="divide-y">
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
            )
          )}
        </div>
      ))}
    </div>
  );
}