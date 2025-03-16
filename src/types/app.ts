import type { Database } from './supabase';

export type Task = {
  id: string;
  title: string;
  description: string | null;
  section_id: string | null;
  due_date: string | null;
  completed: boolean;
  quadrant: number;
};

export type Section = Database['public']['Tables']['sections']['Row'];

export type Quadrant = {
  id: number;
  name: string;
  tasks: Task[];
};

export interface ViewProps {
  quadrants: Quadrant[];
  sections: Section[];
  filteredTasks?: Task[];
  collapsedSections: Set<string>;
  fetchTasks: () => Promise<void>;
  onDragEnd?: (result: DropResult) => void;
  onDelete: (id: string) => void;
  onToggleSection: (id: string) => void;
  onOpenTaskForm?: (quadrantId: number) => void;
  onOpenSectionManager?: () => void;
  onToggleComplete?: (id: string, completed: boolean) => Promise<void>;
  onChangeTaskSection?: (id: string, sectionId: string | null) => Promise<void>;
  onEditTask?: (task: Task) => void;
}