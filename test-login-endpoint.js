const supabase = require('./database/supabase');
const bcrypt = require('bcryptjs');

async function testLoginEndpoint() {
  console.log('Testing login endpoint logic...\n');

  const username = 'milkyway21';
  const password = '21milkadmins';

  console.log('1. Attempting login with:');
  console.log('   Username:', username);
  console.log('   Password:', password);
  console.log('');

  // Simulate the login endpoint
  console.log('2. Querying database...');
  const { data: admin, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('username', username)
    .single();

  if (error) {
    console.log('   ❌ Database error:', error.message);
    console.log('   Error code:', error.code);
    console.log('   Error details:', error.details);
    return;
  }

  if (!admin) {
    console.log('   ❌ No admin user found');
    return;
  }

  console.log('   ✅ Admin user found:');
  console.log('      ID:', admin.id);
  console.log('      Username:', admin.username);
  console.log('      Hash:', admin.password_hash);
  console.log('');

  console.log('3. Verifying password...');
  const isValid = await bcrypt.compare(password, admin.password_hash);
  console.log('   Password match:', isValid ? '✅ YES' : '❌ NO');
  console.log('');

  if (isValid) {
    const token = Buffer.from(`${username}:${password}`).toString('base64');
    console.log('4. ✅ Login would succeed!');
    console.log('   Token:', token);
    console.log('');
    console.log('🎉 All checks passed! Login should work.');
  } else {
    console.log('4. ❌ Login would fail - password mismatch');
  }
}

testLoginEndpoint().catch(console.error);
