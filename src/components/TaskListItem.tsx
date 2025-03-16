import { format } from 'date-fns';
import { Calendar, Check, Trash2, Edit2, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { cn, QUADRANT_COLORS, QUADRANT_NAMES, QUADRANT_TEXT_COLORS } from '../lib/utils';
import type { Task, Section } from '../types/app';

interface TaskListItemProps {
  task: Task;
  sections: Section[];
  onDelete: (id: string) => void;
  onToggleComplete?: (id: string, completed: boolean) => Promise<void>;
  onEdit?: (task: Task) => void;
}

export function TaskListItem({ task, sections, onDelete, onToggleComplete, onEdit }: TaskListItemProps) {
  const [optimisticCompleted, setOptimisticCompleted] = useState(task.completed);
  const [optimisticSectionId, setOptimisticSectionId] = useState(task.section_id);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOptimisticCompleted(task.completed);
  }, [task.completed]);

  useEffect(() => {
    setOptimisticSectionId(task.section_id);
  }, [task.section_id]);

  async function handleToggleComplete() {
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

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {optimisticSectionId && sections.find(s => s.id === optimisticSectionId) && (
              <span className="px-2 py-0.5 text-xs bg-gray-50 text-gray-700 rounded-full border border-gray-200">
                {sections.find(s => s.id === optimisticSectionId)?.name}
              </span>
            )}
            <span className={cn(
              'px-2 py-0.5 text-xs rounded-full border',
              QUADRANT_COLORS[task.quadrant],
              QUADRANT_TEXT_COLORS[task.quadrant]
            )}>
              {QUADRANT_NAMES[task.quadrant]}
            </span>
          </div>
          <h3 className={cn(
            'font-medium',
            optimisticCompleted && 'line-through text-gray-500'
          )}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-gray-600 mt-1">
              {task.description}
            </p>
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
          <button
            onClick={handleToggleComplete}
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
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}