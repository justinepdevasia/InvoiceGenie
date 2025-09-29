import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Project } from '../../../packages/shared-types';

export const useProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('projects')
        .select(`
          *,
          invoices (count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      // Transform the data to include invoice_count
      const transformedData = data?.map((project: any) => ({
        ...project,
        invoice_count: project.invoices?.[0]?.count || 0
      })) || [];

      setProjects(transformedData);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const getProjectById = async (projectId: string): Promise<Project | null> => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          invoices (count)
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;

      return {
        ...data,
        invoice_count: data.invoices?.[0]?.count || 0
      };
    } catch (err) {
      console.error('Error fetching project:', err);
      return null;
    }
  };

  const createProject = async (projectData: {
    name: string;
    description?: string;
  }): Promise<Project | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          ...projectData
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh projects list
      fetchProjects();

      return { ...data, invoice_count: 0 };
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
      return null;
    }
  };

  const updateProject = async (
    projectId: string,
    updates: { name?: string; description?: string }
  ): Promise<Project | null> => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;

      // Refresh projects list
      fetchProjects();

      return data;
    } catch (err) {
      console.error('Error updating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to update project');
      return null;
    }
  };

  const deleteProject = async (projectId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      // Refresh projects list
      fetchProjects();

      return true;
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      return false;
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
  };
};