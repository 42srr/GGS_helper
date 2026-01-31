import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UserService } from '../src/user/user.service';
import { Role } from '../src/auth/enums/role.enum';

async function createAdminUser() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userService = app.get(UserService);

  // 관리자 계정 정보
  const adminData = {
    intraId: 'admin',
    name: 'Administrator',
    password: 'Admin1234', // Change this password after first login
  };

  try {
    // 기존 관리자 계정 확인
    const existingAdmin = await userService.findByIntraId('admin');

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:', existingAdmin.name);

      // 기존 관리자의 역할 업데이트
      const updatedAdmin = await userService.updateUserRole(
        existingAdmin.userId,
        Role.ADMIN,
      );
      console.log('✅ Admin role updated for existing user:', updatedAdmin.name);

      // 비밀번호를 업데이트하기 위해 Repository를 직접 사용
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(adminData.password, 10);

      // DataSource를 통해 직접 업데이트
      const { DataSource } = require('typeorm');
      const dataSource = app.get(DataSource);
      await dataSource.query(
        'UPDATE users SET user_password = $1 WHERE user_intra_id = $2',
        [hashedPassword, 'admin']
      );
      console.log('✅ Admin password updated to: Admin1234');

      await app.close();
      return;
    }

    // 새 관리자 계정 생성 (비밀번호 해싱)
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    const adminUser = await userService.create({
      ...adminData,
      password: hashedPassword,
    });

    // 관리자 역할 부여
    const updatedAdminUser = await userService.updateUserRole(
      adminUser.userId,
      Role.ADMIN,
    );

    console.log('✅ Admin user created successfully:');
    console.log(`   ID: ${updatedAdminUser.userId}`);
    console.log(`   Name: ${updatedAdminUser.name}`);
    console.log(`   Intra ID: ${updatedAdminUser.intraId}`);
    console.log(`   Role: ${updatedAdminUser.role}`);
    console.log(`   ⚠️  Default password: Admin123! (Please change after first login)`);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }

  await app.close();
}

async function createMultipleAdmins() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userService = app.get(UserService);

  // 여러 관리자 계정 생성
  const adminAccounts = [
    {
      intraId: 'admin',
      name: 'Administrator',
      password: 'Admin123!',
    },
    {
      intraId: 'superadmin',
      name: 'Super Administrator',
      password: 'SuperAdmin123!',
    },
  ];

  console.log('🚀 Creating multiple admin accounts...\n');

  for (const adminData of adminAccounts) {
    try {
      const existingAdmin = await userService.findByIntraId(adminData.intraId);

      if (existingAdmin) {
        console.log(`⚠️  ${adminData.name} already exists, updating role...`);
        await userService.updateUserRole(existingAdmin.userId, Role.ADMIN);
        console.log(`✅ ${adminData.name} role updated\n`);
        continue;
      }

      // 비밀번호 해싱
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(adminData.password, 10);

      const adminUser = await userService.create({
        ...adminData,
        password: hashedPassword,
      });

      // 관리자 역할 부여
      const updatedAdminUser = await userService.updateUserRole(
        adminUser.userId,
        Role.ADMIN,
      );

      console.log(`✅ ${updatedAdminUser.name} created successfully`);
      console.log(`   ID: ${updatedAdminUser.userId}`);
      console.log(`   Intra ID: ${updatedAdminUser.intraId}`);
      console.log(`   Role: ${updatedAdminUser.role}\n`);
    } catch (error) {
      console.error(`❌ Error creating ${adminData.name}:`, error.message);
    }
  }

  await app.close();
}

async function promoteUserToAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userService = app.get(UserService);

  // 명령행 인수에서 사용자 intraId 가져오기
  const intraId = process.argv[3];

  if (!intraId) {
    console.log('❌ Usage: npm run create-admin promote <intraId>');
    await app.close();
    return;
  }

  try {
    const user = await userService.findByIntraId(intraId);

    if (!user) {
      console.log(`❌ User with intraId '${intraId}' not found`);
      await app.close();
      return;
    }

    // 관리자 역할 부여
    const updatedUser = await userService.updateUserRole(
      user.userId,
      Role.ADMIN,
    );

    console.log('✅ User promoted to admin successfully:');
    console.log(`   ID: ${updatedUser.userId}`);
    console.log(`   Name: ${updatedUser.name}`);
    console.log(`   Intra ID: ${updatedUser.intraId}`);
    console.log(`   Previous Role: ${user.role}`);
    console.log(`   New Role: ${updatedUser.role}`);
  } catch (error) {
    console.error('❌ Error promoting user to admin:', error.message);
  }

  await app.close();
}

async function listUsers() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userService = app.get(UserService);

  try {
    const users = await userService.findAll();

    console.log('📋 All Users:');
    console.log('─'.repeat(80));

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (@${user.intraId})`);
      console.log(`   Intra ID: ${user.intraId}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isAvailable}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    });

    console.log(`Total users: ${users.length}`);

    const adminCount = users.filter((u) => u.role === Role.ADMIN).length;
    const staffCount = users.filter((u) => u.role === Role.STAFF).length;
    const studentCount = users.filter((u) => u.role === Role.STUDENT).length;

    console.log('\n📊 Role Distribution:');
    console.log(`   Admins: ${adminCount}`);
    console.log(`   Staff: ${staffCount}`);
    console.log(`   Students: ${studentCount}`);
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
  }

  await app.close();
}

// 명령행 인수에 따라 실행할 함수 결정
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'single':
      await createAdminUser();
      break;
    case 'multiple':
      await createMultipleAdmins();
      break;
    case 'promote':
      await promoteUserToAdmin();
      break;
    case 'list':
      await listUsers();
      break;
    default:
      console.log('🔧 Admin User Management Script');
      console.log('');
      console.log('Usage:');
      console.log(
        '  npm run create-admin single       # Create single admin user',
      );
      console.log(
        '  npm run create-admin multiple     # Create multiple admin users',
      );
      console.log(
        '  npm run create-admin promote <intraId>  # Promote existing user to admin',
      );
      console.log('  npm run create-admin list         # List all users and roles');
      console.log('');
      console.log('Examples:');
      console.log('  npm run create-admin single');
      console.log('  npm run create-admin promote jsmith');
      console.log('  npm run create-admin list');
      break;
  }
}

main().catch((error) => {
  console.error('❌ Script execution failed:', error);
  process.exit(1);
});
