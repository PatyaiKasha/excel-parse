import pandas as pd
import os
import sys

def transfer_data(source_path, dest_path, sheet_name='Sheet1'):
    """
    Parses data from a source Excel file and inserts it into a destination Excel file.
    Raises:
        FileNotFoundError: If source or destination file does not exist.
        ValueError: If the sheet or required columns are not found.
    """
    try:
        source_df = pd.read_excel(source_path, sheet_name=sheet_name)
        dest_df = pd.read_excel(dest_path, sheet_name=sheet_name)
    except FileNotFoundError:
        raise
    except Exception as e:
        # Catches errors from pd.read_excel like sheet not found
        raise ValueError(f"Error reading Excel file: {e}")


    # Validate that the key columns exist
    if 'KEY' not in source_df.columns or 'KEY' not in dest_df.columns:
        raise ValueError("'KEY' column not found in one of the files.")

    if 'VALUE_1' not in source_df.columns or 'VALUE_2' not in source_df.columns:
        raise ValueError("'VALUE_1' or 'VALUE_2' column not found in the source file.")


    # Create a mapping from the source KEYs to their data
    source_map = {row['KEY']: row for index, row in source_df.iterrows()}

    # Prepare for data update by ensuring column types are compatible
    if 'VALUE_1' in source_df and 'DATA_A' in dest_df:
        if pd.api.types.is_object_dtype(source_df['VALUE_1'].dtype):
            dest_df['DATA_A'] = dest_df['DATA_A'].astype('object')
    if 'VALUE_2' in source_df and 'DATA_B' in dest_df:
        if pd.api.types.is_object_dtype(source_df['VALUE_2'].dtype):
            dest_df['DATA_B'] = dest_df['DATA_B'].astype('object')

    # Update the destination DataFrame
    for index, row in dest_df.iterrows():
        if row['KEY'] in source_map:
            source_row = source_map[row['KEY']]
            dest_df.at[index, 'DATA_A'] = source_row['VALUE_1']
            dest_df.at[index, 'DATA_B'] = source_row['VALUE_2']

    # Save the updated destination DataFrame
    with pd.ExcelWriter(dest_path, engine='openpyxl') as writer:
        dest_df.to_excel(writer, sheet_name=sheet_name, index=False)


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description="Transfer data between Excel files.")
    parser.add_argument('source_file', help="The source Excel file (relative to the 'data' directory).")
    parser.add_argument('dest_file', help="The destination Excel file (relative to the 'data' directory).")
    parser.add_argument('--sheet', default='Sheet1', help="The sheet name to process.")

    args = parser.parse_args()

    source_path = os.path.join('data', args.source_file)
    dest_path = os.path.join('data', args.dest_file)

    try:
        transfer_data(source_path, dest_path, args.sheet)
        print(f"Data has been successfully transferred to {dest_path}")
    except (FileNotFoundError, ValueError) as e:
        print(f"Error: {e}")
        sys.exit(1)
