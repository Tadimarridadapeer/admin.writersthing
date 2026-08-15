import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zfrtmxqancvfanoqkmrv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'REMOVED_FOR_SECURITY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function resetSuperAdminPassword() {
  console.log('Finding super admin in operations_users table...');
  const { data: users, error: dbError } = await supabase
    .from('operations_users')
    .select('id, email, roles!inner(name)')
    .eq('roles.name', 'Super Admin');

  if (dbError) {
    console.error('Error fetching operations_users:', dbError);
    return;
  }

  if (!users || users.length === 0) {
    console.error('No super admin found.');
    
    console.log('Fetching all operations_users just to see:');
    const { data: allUsers } = await supabase.from('operations_users').select('id, email, roles(name)');
    console.log(allUsers);
    return;
  }

  const superAdmin = users[0];
  console.log(`Found Super Admin: ${superAdmin.email} (${superAdmin.id})`);

  const newPassword = 'SuperSecretPassword123!';
  
  console.log(`Resetting password for ${superAdmin.email} to: ${newPassword}`);
  
  const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(
    superAdmin.id,
    { password: newPassword }
  );

  if (authError) {
    console.error('Error updating password:', authError);
    return;
  }

  console.log('Password successfully reset!');
  console.log(`Email: ${superAdmin.email}`);
  console.log(`New Password: ${newPassword}`);
}

resetSuperAdminPassword();
