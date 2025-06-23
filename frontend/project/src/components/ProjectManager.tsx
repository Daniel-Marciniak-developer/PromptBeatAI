import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Music, 
  Clock, 
  Star, 
  Trash2, 
  Play,
  Download,
  Share2,
  Edit3
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  prompt: string;
  createdAt: Date;
  isFavorite: boolean;
  duration: number;
  style: string;
}

interface ProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: Project) => void;
  onNewProject: () => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({
  isOpen,
  onClose,
  onSelectProject,
  onNewProject
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  // Load projects from localStorage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('promptbeat-projects');
    if (savedProjects) {
      const parsed = JSON.parse(savedProjects);
      setProjects(parsed.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt)
      })));
    }
  }, []);

  // Save projects to localStorage whenever projects change
  useEffect(() => {
    localStorage.setItem('promptbeat-projects', JSON.stringify(projects));
  }, [projects]);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.prompt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'favorites' && project.isFavorite);
    return matchesSearch && matchesFilter;
  });

  const toggleFavorite = (projectId: string) => {
    setProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, isFavorite: !p.isFavorite } : p
    ));
  };

  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-accent-from to-accent-to rounded-lg">
                <Music className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Project Manager</h2>
                <p className="text-white/60 text-sm">Manage your music projects</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Search and Filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-accent-from/50"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'all' 
                    ? 'bg-accent-from text-white' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('favorites')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'favorites' 
                    ? 'bg-accent-from text-white' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                Favorites
              </button>
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <Music className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 mb-4">
                {projects.length === 0 ? 'No projects yet' : 'No projects match your search'}
              </p>
              <button
                onClick={() => {
                  onNewProject();
                  onClose();
                }}
                className="bg-gradient-to-r from-accent-from to-accent-to text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                Create First Project
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredProjects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-white font-medium truncate">{project.name}</h3>
                        <span className="text-xs text-white/40 bg-white/10 px-2 py-1 rounded">
                          {project.style}
                        </span>
                      </div>
                      <p className="text-white/60 text-sm mb-3 line-clamp-2">{project.prompt}</p>
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(project.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Music className="w-3 h-3" />
                          {project.duration}s
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => toggleFavorite(project.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          project.isFavorite 
                            ? 'text-yellow-400 hover:bg-yellow-400/20' 
                            : 'text-white/40 hover:bg-white/10'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${project.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => onSelectProject(project)}
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteProject(project.id)}
                        className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <div className="flex justify-between items-center">
            <p className="text-white/40 text-sm">
              {filteredProjects.length} of {projects.length} projects
            </p>
            <button
              onClick={() => {
                onNewProject();
                onClose();
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-accent-from to-accent-to text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProjectManager;
