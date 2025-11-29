const supabase = require('./database/supabase');
const bcrypt = require('bcryptjs');

async function testLogin() {
  console.log('Testing admin login...\n');

  // Fetch the admin user
  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('username', 'milkyway21')
    .single();

  if (error) {
    console.error('❌ Error fetching admin:', error.message);
    return;
  }

  if (!admin) {
    console.log('❌ Admin user not found!');
    return;
  }

  console.log('✅ Admin user found:');
  console.log('   Username:', admin.username);
  console.log('   Password Hash:', admin.password_hash);

  // Test password
  const testPassword = '21milkadmins';
  const isValid = await bcrypt.compare(testPassword, admin.password_hash);

  console.log('\n🔐 Testing password "21milkadmins":');
  console.log('   Result:', isValid ? '✅ VALID' : '❌ INVALID');

  if (!isValid) {
    console.log('\n⚠️  Password does not match!');
    console.log('   Resetting password to "21milkadmins"...');
    
    const newHash = await bcrypt.hash('21milkadmins', 10);
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({ password_hash: newHash })
      .eq('username', 'milkyway21');

    if (updateError) {
      console.error('   ❌ Failed to update:', updateError.message);
    } else {
      console.log('   ✅ Password reset successfully!');
    }
  }

  console.log('\n📝 Login Credentials:');
  console.log('   Username: milkyway21');
  console.log('   Password: 21milkadmins');
}

testLogin();
