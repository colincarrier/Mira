import { Clock, CheckCircle, Circle } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  completed: boolean;
  priority?: string;
  isActiveReminder?: boolean;
  timeDue?: string | null;
  createdAt: string;
}

interface TaskBadgeProps {
  task: Task;
  onToggle?: (taskId: number) => void;
}

export function TaskBadge({ task, onToggle }: TaskBadgeProps) {
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle?.(task.id);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDueDate = (timeDue?: string | null) => {
    if (!timeDue) return null;
    try {
      return new Date(timeDue).toLocaleDateString();
    } catch {
      return null;
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 transition-colors">
      <button onClick={handleToggle} className="flex-shrink-0">
        {task.completed ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <Circle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
        )}
      </button>
      
      <div className="flex-1">
        <div className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
          {task.title}
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          {task.priority && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          )}
          
          {task.timeDue && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{formatDueDate(task.timeDue)}</span>
            </div>
          )}
          
          {task.isActiveReminder && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
              Reminder
            </span>
          )}
        </div>
      </div>
    </div>
  );
}