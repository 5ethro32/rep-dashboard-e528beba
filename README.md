# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/a93897b1-bf5c-4674-a3ce-2364fcfea630

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/a93897b1-bf5c-4674-a3ce-2364fcfea630) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/a93897b1-bf5c-4674-a3ce-2364fcfea630) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes it is!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Data Consistency Fix for Department Metrics

To ensure proper aggregation of sales data across departments (Retail, REVA, Wholesale) with standardized naming, follow these steps:

### 1. Deploy the SQL Functions

Run the following commands to deploy the stored procedures for data aggregation:

```bash
# Connect to your Supabase project
supabase login
supabase link --project-ref your-project-ref

# Deploy the SQL functions
supabase db push --db-url postgresql://postgres:password@localhost:5432/postgres -f supabase/functions/get_department_metrics.sql
```

### 2. Verify SQL Functions

After deployment, you can verify the functions are working correctly by running:

```sql
-- Test the department metrics function
SELECT * FROM get_department_metrics('March');

-- Test the month data function
SELECT COUNT(*) FROM get_month_data('March');
```

### 3. Manual Fallback (If SQL Deployment Isn't Possible)

If you can't deploy the SQL functions, the application will automatically fall back to JavaScript-based aggregation, which should still work correctly but might be slower.

### How the Fix Works

1. The application now uses standardized department names ('retail', 'reva', 'wholesale') consistently across all operations
2. Metrics are calculated using SQL aggregation when possible, with JS fallback
3. The useDepartmentMetrics hook provides combined metrics based on user's department selections
4. Summary metrics components now use the hook directly for consistent data

These changes ensure that all metric cards display accurate data regardless of which month is selected.
