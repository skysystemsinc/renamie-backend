# Seeders

This directory contains database seeders for the Renamie Backend application. Seeders are used to populate the database with initial data for development, testing, and production environments.

## Available Seeders

### Plan Seeder (`plan.seeder.ts`)
Seeds the database with subscription plans including:
- Free Tier
- Basic Plan (Monthly & Annual)
- Professional Plan (Monthly & Annual)
- Enterprise Plan (Monthly & Annual)

Each plan includes:
- Stripe price IDs (for integration with Stripe)
- Pricing information
- Feature limits (storage, folders, file size, batch size, users)
- Trial periods
- Metadata for UI display

## Usage

### NPM Scripts

The following npm scripts are available for running seeders:

```bash
# Run all seeders
npm run seed

# Run only the plan seeder
npm run seed:plans

# Clear all seeded data
npm run seed:clear

# Reset all data (clear + seed)
npm run seed:reset

# Show seeder status
npm run seed:status
```

### Command Line Options

You can use the `--clear` flag to clear existing data before seeding:

```bash
# Clear existing plans and seed new ones
npm run seed:plans -- --clear

# Clear all data and seed everything
npm run seed -- --clear
```

### Direct Command Usage

You can also run the seeder command directly:

```bash
# Using ts-node
npx ts-node -r tsconfig-paths/register src/seeders/seed.command.ts seed:plans

# Using the compiled version (after building)
node dist/seeders/seed.command.js seed:plans
```

## Seeder Structure

### Base Seeder (`base.seeder.ts`)
Abstract base class that all seeders must extend. Provides the interface for:
- `seed()`: Populate the database with data
- `clear()`: Remove seeded data from the database

### Seeder Service (`seeder.service.ts`)
Main service that manages and orchestrates all seeders. Provides:
- `runSeeders()`: Run multiple seeders with options
- `runPlanSeeder()`: Run only the plan seeder
- `clearAllSeeders()`: Clear all seeded data
- `getSeederStatus()`: Get status of all seeders

### Seed Command (`seed.command.ts`)
Command-line interface for running seeders. Supports:
- `seed`: Run all seeders
- `seed:plans`: Run plan seeder only
- `clear`: Clear all seeded data
- `status`: Show seeder status

## Adding New Seeders

To add a new seeder:

1. Create a new seeder class extending `BaseSeeder`:
```typescript
@Injectable()
export class MySeeder extends BaseSeeder {
  constructor(
    @InjectModel(MyModel.name) private myModel: Model<MyModelDocument>,
  ) {
    super();
  }

  async seed(): Promise<SeederResult> {
    // Implementation
  }

  async clear(): Promise<SeederResult> {
    // Implementation
  }
}
```

2. Add the seeder to `SeedersModule`:
```typescript
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MyModel.name, schema: MyModelSchema },
    ]),
  ],
  providers: [
    MySeeder,
    // ... other providers
  ],
  exports: [
    MySeeder,
    // ... other exports
  ],
})
export class SeedersModule {}
```

3. Update `SeederService` to include the new seeder:
```typescript
constructor(
  private readonly mySeeder: MySeeder,
  // ... other seeders
) {}

private getSeeder(seederName: string) {
  switch (seederName) {
    case 'my-seeder':
      return this.mySeeder;
    // ... other cases
    default:
      return null;
  }
}
```

4. Add npm scripts for the new seeder in `package.json`

## Environment Considerations

- **Development**: Use seeders to populate test data
- **Testing**: Clear and seed data before each test suite
- **Production**: Use with caution, typically for initial setup only

## Data Safety

- Seeders check for existing data before seeding to prevent duplicates
- Use the `--clear` flag to reset data when needed
- Always backup production data before running seeders
- Test seeders in development environment first

## Troubleshooting

### Common Issues

1. **"Plans already exist" error**: Use `--clear` flag or run `npm run seed:clear` first
2. **Database connection issues**: Ensure MongoDB is running and connection string is correct
3. **TypeScript compilation errors**: Run `npm run build` first or use `ts-node` directly

### Debug Mode

For debugging, you can run the seeder command with additional logging:

```bash
DEBUG=* npm run seed:plans
```

## Integration with CI/CD

Seeders can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions step
- name: Seed Database
  run: |
    npm run build
    npm run seed:reset
```
