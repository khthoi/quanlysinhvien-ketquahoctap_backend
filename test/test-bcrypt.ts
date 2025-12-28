import * as bcrypt from 'bcrypt';
import * as readline from 'readline';

// Tạo interface đọc input từ terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Hỏi người dùng nhập mật khẩu
rl.question('Nhập mật khẩu: ', async (password: string) => {
  try {
    // Hash mật khẩu với saltRounds = 10
    const hash = await bcrypt.hash(password, 10);

    console.log('Mã hash bcrypt:');
    console.log(hash);
  } catch (error) {
    console.error('Lỗi khi hash mật khẩu:', error);
  } finally {
    rl.close();
  }
});
