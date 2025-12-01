import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeederService } from './seeder.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('SeederCommand');

  try {
    logger.log('Initializing NestJS application...');
    const app = await NestFactory.createApplicationContext(AppModule);

    const seederService = app.get(SeederService);

    // Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0] || 'seed'; // Default to 'seed' if no command provided
    const clearFirst = args.includes('--clear');

    logger.log(`Running seeder command: ${command}`);
    logger.log(`Clear first: ${clearFirst}`);

    let results;

    switch (command) {
      case 'seed':
        results = await seederService.runSeeders({ clearFirst });
        break;
      case 'seed:plans':
        results = await seederService.runPlanSeeder(clearFirst);
        break;
      case 'seed:users':
        results = await seederService.runUserSeeder(clearFirst);
        break;
      case 'clear':
        results = await seederService.clearAllSeeders();
        break;
      case 'status':
        const status = await seederService.getSeederStatus();
        logger.log('Seeder Status:');
        console.log(JSON.stringify(status, null, 2));
        await app.close();
        return;
      case 'help':
      case '--help':
      case '-h':
        logger.log('Renamie Backend Seeder Commands:');
        logger.log('');
        logger.log('Available commands:');
        logger.log('  seed [--clear]        - Run all seeders');
        logger.log('  seed:plans [--clear]  - Run plan seeder only');
        logger.log('  clear                 - Clear all seeded data');
        logger.log('  status                - Show seeder status');
        logger.log('  help                  - Show this help message');
        logger.log('');
        logger.log('Examples:');
        logger.log('  npm run seed                    # Run all seeders');
        logger.log('  npm run seed:plans              # Run plan seeder only');
        logger.log('  npm run seed:plans -- --clear   # Clear and seed plans');
        logger.log('  npm run seed:clear              # Clear all data');
        logger.log('  npm run seed:status             # Check seeder status');
        await app.close();
        return;
      default:
        logger.error(`Unknown command: ${command}`);
        logger.log('Use "help" to see available commands');
        await app.close();
        return;
    }

    // Display results
    logger.log('\n=== Seeder Results ===');
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      logger.log(`${status} ${result.message}`);
      if (result.error) {
        logger.error(`   Error: ${result.error}`);
      }
    });

    const successCount = results.filter((r) => r.success).length;
    const totalCount = results.length;

    logger.log(
      `\nCompleted: ${successCount}/${totalCount} operations successful`,
    );

    await app.close();
    process.exit(successCount === totalCount ? 0 : 1);
  } catch (error) {
    logger.error('Failed to run seeder command:', error);
    process.exit(1);
  }
}

bootstrap();
