import pandas as pd
import numpy as np
import os
import re

def merge_sales_data():
    """Simple script to merge sales data - no options, just do it"""
    
    # File paths
    folder_path = r"C:\Users\jethr\OneDrive - Aver Generics Ltd\Desktop\MTD"
    master_file = os.path.join(folder_path, "Master_Rep_MTD_20250531.csv")
    sales_file = os.path.join(folder_path, "Sales Data June.xlsx")
    output_file = os.path.join(folder_path, "Master_Rep_MTD_Updated.csv")
    
    print("Sales Data Merger - Adding values from June data")
    print("=" * 55)
    
    # Load files
    print("Loading files...")
    master_df = pd.read_csv(master_file)
    sales_df = pd.read_excel(sales_file, sheet_name='Sales')
    print(f"✓ Master file: {len(master_df)} rows")
    print(f"✓ Sales file: {len(sales_df)} rows")
    
    # Filter sales data for May 19 onwards
    print("\nFiltering sales data from May 19 onwards...")
    def is_may_19_or_later(time_str):
        if pd.isna(time_str):
            return False
        try:
            match = re.search(r'(\d+)\s+May\s+25', str(time_str))
            if match:
                day = int(match.group(1))
                return day >= 19
        except:
            pass
        return False
    
    sales_df['include'] = sales_df['Time'].apply(is_may_19_or_later)
    filtered_sales = sales_df[sales_df['include'] == True].copy()
    print(f"✓ Filtered to {len(filtered_sales)} rows from May 19+")
    
    # Group by customer and sum totals, but also get the Rep
    print("\nGrouping sales by customer...")
    sales_summary = filtered_sales.groupby('Customer').agg({
        'Total Price': 'sum',  # Will be added to Spend
        'Profit': 'sum',       # Will be added to Profit
        'Rep': 'first'         # Get the Rep name for new accounts
    }).reset_index()
    print(f"✓ {len(sales_summary)} unique customers")
    
    # Create copy for updating
    updated_master = master_df.copy()
    
    # Track progress
    matched = 0
    new_accounts = 0
    total_spend_added = 0
    total_profit_added = 0
    unmatched_customers = []
    
    print("\nProcessing customers...")
    print("-" * 40)
    
    # Process each customer
    for _, row in sales_summary.iterrows():
        customer = row['Customer']
        total_price = row['Total Price']
        profit = row['Profit']
        rep = row['Rep']  # Get the rep from sales data
        
        # Find exact match
        mask = updated_master['Account Name'] == customer
        
        if mask.any():
            # EXISTING ACCOUNT: Add to existing values
            current_spend = pd.to_numeric(updated_master.loc[mask, 'Spend'], errors='coerce').fillna(0)
            current_profit = pd.to_numeric(updated_master.loc[mask, 'Profit'], errors='coerce').fillna(0)
            
            updated_master.loc[mask, 'Spend'] = current_spend + total_price
            updated_master.loc[mask, 'Profit'] = current_profit + profit
            
            matched += 1
            print(f"✓ Updated: {customer}")
            print(f"  +£{total_price:,.2f} spend, +£{profit:,.2f} profit")
        else:
            # NEW ACCOUNT: Add as new row
            unmatched_customers.append({
                'Customer': customer,
                'Total_Price': total_price,
                'Profit': profit,
                'Rep': rep  # Include the rep
            })
    
    # Add new rows for unmatched customers
    if unmatched_customers:
        print(f"\nAdding {len(unmatched_customers)} new accounts...")
        print("-" * 40)
        
        for customer_data in unmatched_customers:
            customer = customer_data['Customer']
            total_price = customer_data['Total_Price']
            profit = customer_data['Profit']
            rep = customer_data['Rep']  # Use the actual rep from sales data
            
            # Create new row with same structure as master file
            new_row = {
                'Rep': rep,  # Use actual rep from sales data
                'Account Ref': '',  # Will need to be assigned
                'Account Name': customer,
                'Spend': total_price,
                'Cost': 0,  # Will need to be calculated
                'Credit': 0,
                'Profit': profit,
                'Margin': '',  # Will need to be calculated
                'Packs': 0   # Will need to be calculated
            }
            
            # Add to dataframe
            updated_master = pd.concat([updated_master, pd.DataFrame([new_row])], ignore_index=True)
            new_accounts += 1
            
            print(f"+ New: {customer}")
            print(f"  Rep: {rep}, £{total_price:,.2f} spend, £{profit:,.2f} profit")
        
        total_spend_added = sales_summary['Total Price'].sum()
        total_profit_added = sales_summary['Profit'].sum()
    else:
        total_spend_added = sales_summary['Total Price'].sum()
        total_profit_added = sales_summary['Profit'].sum()
    
    # Save updated file
    print(f"\nSaving updated file...")
    updated_master.to_csv(output_file, index=False)
    
    # Summary
    print("\n" + "=" * 50)
    print("COMPLETED")
    print("=" * 50)
    print(f"Customers processed: {len(sales_summary)}")
    print(f"Existing accounts updated: {matched}")
    print(f"New accounts added: {new_accounts}")
    print(f"Total rows in output: {len(updated_master)}")
    print(f"Total Spend added: £{total_spend_added:,.2f}")
    print(f"Total Profit added: £{total_profit_added:,.2f}")
    print(f"✓ File saved: Master_Rep_MTD_Updated.csv")
    
    if new_accounts > 0:
        print(f"\nNote: {new_accounts} new accounts were added with their assigned reps.")
        print("You may want to assign proper Account Ref values.")

if __name__ == "__main__":
    merge_sales_data()