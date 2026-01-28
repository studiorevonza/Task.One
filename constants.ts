import { TaskStatus, Priority, Category, Project, Task } from './types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: 'Q4 Marketing Campaign',
    description: 'Launch the new product marketing strategy for Q4.',
    category: Category.COMPANY,
    priority: Priority.HIGH,
    dueDate: '2024-12-15',
    progress: 35
  },
  {
    id: 'p2',
    name: 'Home Renovation',
    description: 'Plan and execute the kitchen remodel.',
    category: Category.PERSONAL,
    priority: Priority.MEDIUM,
    dueDate: '2024-11-30',
    progress: 10
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    projectId: 'p1',
    title: 'Draft Social Media Copy',
    description: 'Create copy for Instagram and LinkedIn posts.',
    status: TaskStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    category: Category.COMPANY,
    dueDate: '2024-10-25'
  },
  {
    id: 't2',
    projectId: 'p1',
    title: 'Design Banner Ads',
    description: 'Coordinate with design team for banner assets.',
    status: TaskStatus.TODO,
    priority: Priority.MEDIUM,
    category: Category.COMPANY,
    dueDate: '2024-10-28',
    dependencies: ['t1']
  },
  {
    id: 't3',
    projectId: 'p2',
    title: 'Select Tiles',
    description: 'Visit showroom to pick backsplash tiles.',
    status: TaskStatus.DONE,
    priority: Priority.LOW,
    category: Category.PERSONAL,
    dueDate: '2024-10-15'
  },
  {
    id: 't4',
    title: 'Weekly Team Sync',
    description: 'Discuss project blockers.',
    status: TaskStatus.TODO,
    priority: Priority.HIGH,
    category: Category.COMPANY,
    dueDate: '2024-10-24'
  }
];