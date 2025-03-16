import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { requestNotificationPermission } from '../lib/notifications';
import { cn, QUADRANT_NAMES } from '../lib/utils';
import { Calendar, Layers, Clock, Bell } from 'lucide-react';
import type { Database } from '../types/supabase';
import type { Task } from '../types/app';

interface TaskFormProps {
  quadrant: number;
  task?: Task;
  onClose: () => void;
  onSuccess: () => void;
}

export function TaskForm({ quadrant, task, onClose, onSuccess }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueDate, setDueDate] = useState(() => {
    if (!task?.due_date) return '';
    // Convert to local datetime-local format
    const date = new Date(task.due_date);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });
  const [sectionId, setSectionId] = useState<string | null>(task?.section_id || null);
  const [sections, setSections] = useState<Database['public']['Tables']['sections']['Row'][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    'Notification' in window && Notification.permission === 'granted'
  );

  useEffect(() => {
    fetchSections();
  }, []);

  async function handleNotificationToggle() {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
  }

  async function fetchSections() {
    try {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;
      setSections(data || []);
    } catch (err) {
      console.error('Error fetching sections:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (task) {
        // Update existing task
        const { error } = await supabase
          .from('tasks')
          .update({
            title,
            description,
            section_id: sectionId,
            due_date: dueDate ? new Date(dueDate).toISOString() : null,
          })
          .eq('id', task.id);

        if (error) throw error;
      } else {
        // Create new task
        const { error } = await supabase
          .from('tasks')
          .insert({
            title,
            description,
            quadrant,
            section_id: sectionId,
            due_date: dueDate ? new Date(dueDate).toISOString() : null,
          });

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">
          {task ? 'Edit Task' : `New Task in ${QUADRANT_NAMES[quadrant]}`}
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Due Date
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-md pl-10"
              />
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            {dueDate && (
              <button
                type="button"
                onClick={handleNotificationToggle}
                className={cn(
                  'mt-2 text-sm flex items-center gap-2',
                  notificationsEnabled ? 'text-green-600' : 'text-gray-500'
                )}
              >
                <Bell size={14} />
                {notificationsEnabled
                  ? 'Notifications enabled'
                  : 'Enable notifications'}
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Section
            </label>
            <div className="relative">
              <select
                value={sectionId || ''}
                onChange={(e) => setSectionId(e.target.value || null)}
                className="w-full px-3 py-2 border rounded-md pl-10 appearance-none"
              >
                <option value="">No Section</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
              <Layers className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'px-4 py-2 rounded-md text-white flex items-center gap-2',
                loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              )}
            >
              {loading ? (
                <>
                  <Clock className="animate-spin" size={18} />
                  {task ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                task ? 'Save Changes' : 'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}