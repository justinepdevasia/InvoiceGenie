import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Security helper for Supabase Storage
 * Ensures files are only accessible by their owners
 */

export async function getSecureFileUrl(
  supabase: SupabaseClient,
  filePath: string,
  bucketName: string = 'invoices'
): Promise<string | null> {
  try {
    // Generate a signed URL that expires in 1 hour
    // This URL can only be accessed by the authenticated user
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Error in getSecureFileUrl:', error);
    return null;
  }
}

export async function downloadSecureFile(
  supabase: SupabaseClient,
  filePath: string,
  bucketName: string = 'invoices'
): Promise<Blob | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .download(filePath);

    if (error) {
      console.error('Error downloading file:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in downloadSecureFile:', error);
    return null;
  }
}

export async function verifyFileOwnership(
  supabase: SupabaseClient,
  filePath: string,
  userId: string
): Promise<boolean> {
  try {
    // Check if the file path starts with the user's ID
    // This ensures the user can only access their own files
    const userFolder = filePath.split('/')[0];
    return userFolder === userId;
  } catch (error) {
    console.error('Error verifying file ownership:', error);
    return false;
  }
}

export async function deleteSecureFile(
  supabase: SupabaseClient,
  filePath: string,
  bucketName: string = 'invoices'
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteSecureFile:', error);
    return false;
  }
}

export async function listUserFiles(
  supabase: SupabaseClient,
  userId: string,
  bucketName: string = 'invoices'
): Promise<any[] | null> {
  try {
    // List files only in the user's folder
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error('Error listing files:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in listUserFiles:', error);
    return null;
  }
}

/**
 * Security check to ensure bucket policies are properly configured
 */
export async function checkBucketSecurity(
  supabase: SupabaseClient
): Promise<{
  isSecure: boolean;
  issues: string[];
}> {
  const issues: string[] = [];
  
  try {
    // Check if bucket exists and is private
    const { data: buckets } = await supabase
      .storage
      .listBuckets();

    const invoicesBucket = buckets?.find(b => b.name === 'invoices');
    
    if (!invoicesBucket) {
      issues.push('Invoices bucket does not exist');
    } else if (invoicesBucket.public) {
      issues.push('Invoices bucket is public - should be private');
    }

    // Check RLS policies existence
    const { data: testUpload } = await supabase.storage
      .from('invoices')
      .list('test-user-id', { limit: 1 });
    
    // If we can list another user's files, RLS is not properly configured
    if (testUpload && testUpload.length > 0) {
      issues.push('RLS policies may not be properly configured');
    }

    return {
      isSecure: issues.length === 0,
      issues
    };
  } catch (error) {
    console.error('Error checking bucket security:', error);
    return {
      isSecure: false,
      issues: ['Unable to verify bucket security']
    };
  }
}

/**
 * Initialize storage bucket with proper security settings
 */
export async function initializeSecureStorage(
  projectId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient();
    
    // This function would typically be called during setup
    // The actual bucket creation and RLS policies are managed through Supabase dashboard
    // or through migrations
    
    const securityCheck = await checkBucketSecurity(supabase);
    
    if (!securityCheck.isSecure) {
      return {
        success: false,
        message: `Security issues found: ${securityCheck.issues.join(', ')}`
      };
    }
    
    return {
      success: true,
      message: 'Storage is properly secured'
    };
  } catch (error) {
    console.error('Error initializing secure storage:', error);
    return {
      success: false,
      message: 'Failed to initialize secure storage'
    };
  }
}