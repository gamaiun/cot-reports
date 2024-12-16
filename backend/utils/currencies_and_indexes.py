
import os
import pandas as pd
import yfinance as yf
import cot_reports as cot
from filelock import FileLock
from pandas.tseries.offsets import BDay

# Set up cache directory
CACHE_DIR = "data_cache"
os.makedirs(CACHE_DIR, exist_ok=True)

# Mapping of COT tickers to Yahoo Finance tickers
CURRENCY_COTS_TO_YF_TICKERS = {
    'CANADIAN DOLLAR - CHICAGO MERCANTILE EXCHANGE': 'CAD=X',
    'JAPANESE YEN - CHICAGO MERCANTILE EXCHANGE': 'JPY=X',
#     'U.S. DOLLAR INDEX - ICE FUTURES U.S.': 'DX-Y.NYB',
    'EURO FX - CHICAGO MERCANTILE EXCHANGE': 'EUR=X',
    'BRITISH POUND STERLING - CHICAGO MERCANTILE EXCHANGE': 'GBP=X',
}

# Columns to drop during data cleaning
COLUMNS_TO_DROP = [
   'CFTC_Region_Code', 'CFTC_Commodity_Code', 'Open_Interest_All',
        'Dealer_Positions_Spread_All', 'Asset_Mgr_Positions_Long_All',
        'Asset_Mgr_Positions_Short_All', 'Asset_Mgr_Positions_Spread_All',
        'Lev_Money_Positions_Long_All', 'Lev_Money_Positions_Short_All',
        'Lev_Money_Positions_Spread_All', 'Other_Rept_Positions_Long_All',
        'Other_Rept_Positions_Short_All', 'Other_Rept_Positions_Spread_All',
        'Tot_Rept_Positions_Long_All', 'Tot_Rept_Positions_Short_All',
        'NonRept_Positions_Long_All', 'NonRept_Positions_Short_All',
        'Change_in_Open_Interest_All', 'Change_in_Dealer_Long_All',
        'Change_in_Dealer_Short_All', 'Change_in_Dealer_Spread_All',
        'Change_in_Asset_Mgr_Long_All', 'Change_in_Asset_Mgr_Short_All',
        'Change_in_Asset_Mgr_Spread_All', 'Change_in_Lev_Money_Long_All',
        'Change_in_Lev_Money_Short_All', 'Change_in_Lev_Money_Spread_All',
        'Change_in_Other_Rept_Long_All', 'Change_in_Other_Rept_Short_All',
        'Change_in_Other_Rept_Spread_All', 'Change_in_Tot_Rept_Long_All',
        'Change_in_Tot_Rept_Short_All', 'Change_in_NonRept_Long_All',
        'Change_in_NonRept_Short_All', 'Pct_of_Open_Interest_All',
        'Pct_of_OI_Dealer_Long_All', 'Pct_of_OI_Dealer_Short_All',
        'Pct_of_OI_Dealer_Spread_All', 'Pct_of_OI_Asset_Mgr_Long_All',
        'Pct_of_OI_Asset_Mgr_Short_All', 'Pct_of_OI_Asset_Mgr_Spread_All',
        'Pct_of_OI_Lev_Money_Long_All', 'Pct_of_OI_Lev_Money_Short_All',
        'Pct_of_OI_Lev_Money_Spread_All', 'Pct_of_OI_Other_Rept_Long_All',
        'Pct_of_OI_Other_Rept_Short_All', 'Pct_of_OI_Other_Rept_Spread_All',
        'Pct_of_OI_Tot_Rept_Long_All', 'Pct_of_OI_Tot_Rept_Short_All',
        'Pct_of_OI_NonRept_Long_All', 'Pct_of_OI_NonRept_Short_All',
        'Traders_Tot_All',
        'Traders_Dealer_Spread_All',
        'Traders_Asset_Mgr_Spread_All', 'Traders_Lev_Money_Long_All',
        'Traders_Lev_Money_Short_All', 'Traders_Lev_Money_Spread_All',
        'Traders_Other_Rept_Long_All', 'Traders_Other_Rept_Short_All',
        'Traders_Other_Rept_Spread_All', 'Traders_Tot_Rept_Long_All',
        'Traders_Tot_Rept_Short_All', 'Conc_Gross_LE_4_TDR_Long_All',
        'Conc_Gross_LE_4_TDR_Short_All', 'Conc_Gross_LE_8_TDR_Long_All',
        'Conc_Gross_LE_8_TDR_Short_All', 'Conc_Net_LE_4_TDR_Long_All',
        'Conc_Net_LE_4_TDR_Short_All', 'Conc_Net_LE_8_TDR_Long_All',
        'Conc_Net_LE_8_TDR_Short_All', 'Contract_Units',
        'CFTC_Contract_Market_Code_Quotes', 'CFTC_Market_Code_Quotes',
        'CFTC_Commodity_Code_Quotes', 'CFTC_SubGroup_Code',
        'FutOnly_or_Combined', "As_of_Date_In_Form_YYMMDD", "Dealer_Positions_Long_All", "Dealer_Positions_Short_All",
        "CFTC_Contract_Market_Code", "CFTC_Market_Code"
]

# Column renaming mapping for readability
RENAMING_DICT = {
    'Market_and_Exchange_Names': 'ticker',
    'Report_Date_as_YYYY-MM-DD': 'date',
    'Traders_Dealer_Long_All': 'Dealer Long',
    'Traders_Dealer_Short_All': 'Dealer Short',
    'Traders_Asset_Mgr_Long_All': 'Asset Manager Long',
    'Traders_Asset_Mgr_Short_All': 'Asset Manager Short',
}


def download_currency_prices():
    """
    Download historical currency prices from Yahoo Finance and align them to a common date range.
    """
    start_date = "2020-01-01"
    end_date = pd.Timestamp.now().strftime("%Y-%m-%d")
    common_date_range = pd.date_range(start=start_date, end=end_date, freq="B")  # Business days
    currency_prices = {}

    for yf_ticker in CURRENCY_COTS_TO_YF_TICKERS.values():
        print(f"Downloading price data for {yf_ticker}...")
        try:
            price_data = yf.download(yf_ticker, start=start_date, end=end_date, interval="1d")
            if not price_data.empty:
                # Extract and align prices to common date range
                price_data = price_data[['Close']].copy()
                price_data.index = pd.to_datetime(price_data.index)
                price_data.rename(columns={'Close': yf_ticker}, inplace=True)
                price_data = price_data.reindex(common_date_range, method="ffill")
                currency_prices[yf_ticker] = price_data
        except Exception as e:
            print(f"Failed to download data for {yf_ticker}: {e}")

    # Combine all prices into a single DataFrame
    if currency_prices:
        combined_prices = pd.concat(currency_prices.values(), axis=1)
        combined_prices = combined_prices.sort_index().drop_duplicates()
    else:
        combined_prices = pd.DataFrame()

    return combined_prices

def process_currency_cot_data(currency_prices):
    """
    Download, filter, rename, convert date, set index, add YF_Ticker, and populate it with actual numeric values.
    """
    columns_to_drop = [
        'CFTC_Region_Code', 'CFTC_Commodity_Code', 'Open_Interest_All',
        'Dealer_Positions_Spread_All', 'Asset_Mgr_Positions_Long_All',
        'Asset_Mgr_Positions_Short_All', 'Asset_Mgr_Positions_Spread_All',
        'Lev_Money_Positions_Long_All', 'Lev_Money_Positions_Short_All',
        'Lev_Money_Positions_Spread_All', 'Other_Rept_Positions_Long_All',
        'Other_Rept_Positions_Short_All', 'Other_Rept_Positions_Spread_All',
        'Tot_Rept_Positions_Long_All', 'Tot_Rept_Positions_Short_All',
        'NonRept_Positions_Long_All', 'NonRept_Positions_Short_All',
        'Change_in_Open_Interest_All', 'Change_in_Dealer_Long_All',
        'Change_in_Dealer_Short_All', 'Change_in_Dealer_Spread_All',
        'Change_in_Asset_Mgr_Long_All', 'Change_in_Asset_Mgr_Short_All',
        'Change_in_Asset_Mgr_Spread_All', 'Change_in_Lev_Money_Long_All',
        'Change_in_Lev_Money_Short_All', 'Change_in_Lev_Money_Spread_All',
        'Change_in_Other_Rept_Long_All', 'Change_in_Other_Rept_Short_All',
        'Change_in_Other_Rept_Spread_All', 'Change_in_Tot_Rept_Long_All',
        'Change_in_Tot_Rept_Short_All', 'Change_in_NonRept_Long_All',
        'Change_in_NonRept_Short_All', 'Pct_of_Open_Interest_All',
        'Pct_of_OI_Dealer_Long_All', 'Pct_of_OI_Dealer_Short_All',
        'Pct_of_OI_Dealer_Spread_All', 'Pct_of_OI_Asset_Mgr_Long_All',
        'Pct_of_OI_Asset_Mgr_Short_All', 'Pct_of_OI_Asset_Mgr_Spread_All',
        'Pct_of_OI_Lev_Money_Long_All', 'Pct_of_OI_Lev_Money_Short_All',
        'Pct_of_OI_Lev_Money_Spread_All', 'Pct_of_OI_Other_Rept_Long_All',
        'Pct_of_OI_Other_Rept_Short_All', 'Pct_of_OI_Other_Rept_Spread_All',
        'Pct_of_OI_Tot_Rept_Long_All', 'Pct_of_OI_Tot_Rept_Short_All',
        'Pct_of_OI_NonRept_Long_All', 'Pct_of_OI_NonRept_Short_All',
        'Traders_Tot_All',
        'Traders_Dealer_Spread_All',
        'Traders_Asset_Mgr_Spread_All', 'Traders_Lev_Money_Long_All',
        'Traders_Lev_Money_Short_All', 'Traders_Lev_Money_Spread_All',
        'Traders_Other_Rept_Long_All', 'Traders_Other_Rept_Short_All',
        'Traders_Other_Rept_Spread_All', 'Traders_Tot_Rept_Long_All',
        'Traders_Tot_Rept_Short_All', 'Conc_Gross_LE_4_TDR_Long_All',
        'Conc_Gross_LE_4_TDR_Short_All', 'Conc_Gross_LE_8_TDR_Long_All',
        'Conc_Gross_LE_8_TDR_Short_All', 'Conc_Net_LE_4_TDR_Long_All',
        'Conc_Net_LE_4_TDR_Short_All', 'Conc_Net_LE_8_TDR_Long_All',
        'Conc_Net_LE_8_TDR_Short_All', 'Contract_Units',
        'CFTC_Contract_Market_Code_Quotes', 'CFTC_Market_Code_Quotes',
        'CFTC_Commodity_Code_Quotes', 'CFTC_SubGroup_Code',
        'FutOnly_or_Combined', "As_of_Date_In_Form_YYMMDD", "Dealer_Positions_Long_All", "Dealer_Positions_Short_All",
        "CFTC_Contract_Market_Code", "CFTC_Market_Code"
    ]

def process_currency_cot_data(currency_prices):
    """
    Process currency and COT data, ensuring proper filtering and integration.
    """
        # Debug: Log the incoming currency prices
      

        # Rest of the function...


    try:
        # Download and concatenate COT data for multiple years
        df = pd.concat(
            [pd.DataFrame(cot.cot_year(year, cot_report_type='traders_in_financial_futures_futopt'))
             for year in range(2020, 2025)],
            ignore_index=True
        )

        # Filter relevant rows based on tickers
        filtered_df = df[df['Market_and_Exchange_Names'].isin(CURRENCY_COTS_TO_YF_TICKERS.keys())].copy()

        # Rename relevant columns for readability
        filtered_df.rename(columns=RENAMING_DICT, inplace=True)

        # Convert date column to datetime format
        filtered_df['date'] = pd.to_datetime(filtered_df['date'], errors='coerce')

        # Set the index to ['ticker', 'date']
        filtered_df.set_index(['ticker', 'date'], inplace=True)

        # Convert relevant columns to numeric
        numeric_columns = [
            'Dealer Long', 'Dealer Short',
            'Asset Manager Long', 'Asset Manager Short'
        ]
        for col in numeric_columns:
            if col in filtered_df.columns:
                filtered_df[col] = pd.to_numeric(filtered_df[col], errors='coerce')

        # Calculate new columns
        filtered_df['Net Dealers'] = filtered_df['Dealer Long'] - filtered_df['Dealer Short']
        filtered_df['Net Asset Managers'] = filtered_df['Asset Manager Long'] - filtered_df['Asset Manager Short']

        # Drop irrelevant columns
        filtered_df.drop(columns=columns_to_drop, inplace=True, errors='ignore')

        # Add YF_Ticker column based on CURRENCY_COTS_TO_YF_TICKERS mapping
        filtered_df['YF_Ticker'] = filtered_df.index.get_level_values('ticker').map(CURRENCY_COTS_TO_YF_TICKERS)

        # Populate YF_Ticker with numeric values from currency_prices
        filtered_df['YF_Ticker_Values'] = filtered_df.apply(
            lambda row: currency_prices.loc[row.name[1], row['YF_Ticker']]
            if row['YF_Ticker'] in currency_prices.columns and row.name[1] in currency_prices.index else None,
            axis=1
        )

        return filtered_df

    except Exception as e:
        print(f"Error processing COT data: {e}")
        return pd.DataFrame()


def load_currency_data(force_refresh=False):
    """Load or download currency data, ensuring no duplicates or index issues."""
    cache_file = os.path.join(CACHE_DIR, "currency_combined_data.h5")
    lock_file = f"{cache_file}.lock"

    if not force_refresh and os.path.exists(cache_file):
        try:
            with FileLock(lock_file):
                print("Loading cached currency data...")
                cached_data = pd.read_hdf(cache_file, key="combined")
            
            # Validate cached data
            if 'YF_Ticker_Values' not in cached_data.columns:
                print("Cached data is invalid. Refreshing...")
                return load_currency_data(force_refresh=True)

            return cached_data

        except Exception as e:
            print(f"Error loading cached data: {e}. Refreshing...")
            return load_currency_data(force_refresh=True)

    print("Downloading fresh data...")
    try:
        # Step 1: Download currency prices
        currency_prices = download_currency_prices()
        if currency_prices.empty:
            print("No currency prices available. Aborting data processing.")
            return pd.DataFrame()

        # Step 2: Process COT data with currency prices
        combined_data = process_currency_cot_data(currency_prices)

    except Exception as e:
        print(f"Error merging currency and COT data: {e}")
        return pd.DataFrame()

    # Step 3: Save to cache if data exists
    if not combined_data.empty:
        try:
            with FileLock(lock_file):
                combined_data.to_hdf(cache_file, key="combined", mode="w")
            print("Data successfully saved to cache.")
        except Exception as e:
            print(f"Error saving data to cache: {e}")
    else:
        print("No data available to save. Cache not updated.")

    return combined_data

