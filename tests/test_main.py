import unittest
import pandas as pd
import os
import shutil
import numpy as np
from src.main import transfer_data

class TestTransferData(unittest.TestCase):

    def setUp(self):
        """Set up a temporary directory and test files."""
        self.test_dir = 'temp_test_data'
        os.makedirs(self.test_dir, exist_ok=True)

        # Create source data
        self.source_path = os.path.join(self.test_dir, 'source.xlsx')
        source_data = {
            'KEY': ['A', 'C'],
            'VALUE_1': [100, 300],
            'VALUE_2': ['X1', 'Z1']
        }
        pd.DataFrame(source_data).to_excel(self.source_path, index=False, sheet_name='Sheet1')

        # Create destination data
        self.dest_path = os.path.join(self.test_dir, 'destination.xlsx')
        dest_data = {
            'KEY': ['A', 'B', 'C'],
            'DATA_A': [np.nan, 999, np.nan],
            'DATA_B': [np.nan, 'other', np.nan]
        }
        pd.DataFrame(dest_data).to_excel(self.dest_path, index=False, sheet_name='Sheet1')

    def tearDown(self):
        """Clean up the temporary directory."""
        shutil.rmtree(self.test_dir)

    def test_successful_transfer(self):
        """Test a successful data transfer."""
        transfer_data(self.source_path, self.dest_path)

        # Verify the output
        result_df = pd.read_excel(self.dest_path)
        self.assertEqual(result_df.loc[result_df['KEY'] == 'A', 'DATA_A'].iloc[0], 100)
        self.assertEqual(result_df.loc[result_df['KEY'] == 'A', 'DATA_B'].iloc[0], 'X1')
        self.assertEqual(result_df.loc[result_df['KEY'] == 'C', 'DATA_A'].iloc[0], 300)
        self.assertEqual(result_df.loc[result_df['KEY'] == 'C', 'DATA_B'].iloc[0], 'Z1')
        # Check that untouched rows remain the same
        self.assertEqual(result_df.loc[result_df['KEY'] == 'B', 'DATA_A'].iloc[0], 999)

    def test_file_not_found(self):
        """Test that FileNotFoundError is raised for a missing file."""
        with self.assertRaises(FileNotFoundError):
            transfer_data('nonexistent.xlsx', self.dest_path)

    def test_sheet_not_found(self):
        """Test that ValueError is raised for a missing sheet."""
        with self.assertRaises(ValueError):
            transfer_data(self.source_path, self.dest_path, sheet_name='InvalidSheet')

    def test_key_column_missing_source(self):
        """Test ValueError for missing KEY column in source."""
        bad_source_path = os.path.join(self.test_dir, 'bad_source.xlsx')
        bad_source_data = {'NO_KEY': ['A'], 'VALUE_1': [1], 'VALUE_2': ['X']}
        pd.DataFrame(bad_source_data).to_excel(bad_source_path, index=False)

        with self.assertRaisesRegex(ValueError, "'KEY' column not found"):
            transfer_data(bad_source_path, self.dest_path)

    def test_value_column_missing_source(self):
        """Test ValueError for missing VALUE column in source."""
        bad_source_path = os.path.join(self.test_dir, 'bad_source.xlsx')
        bad_source_data = {'KEY': ['A'], 'VALUE_1': [1]}
        pd.DataFrame(bad_source_data).to_excel(bad_source_path, index=False)

        with self.assertRaisesRegex(ValueError, "'VALUE_1' or 'VALUE_2' column not found"):
            transfer_data(bad_source_path, self.dest_path)

if __name__ == '__main__':
    unittest.main()
