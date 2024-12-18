
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
    Returns a flattened DataFrame with 'date' as the index.
    """
    start_date = "2020-01-01"
    end_date = pd.Timestamp.now().strftime("%Y-%m-%d")
    common_date_range = pd.date_range(start=start_date, end=end_date, freq="B")  # Business days

    all_prices = []  # Collect individual DataFrames for each currency

    for yf_ticker in CURRENCY_COTS_TO_YF_TICKERS.values():
        print(f"Downloading price data for {yf_ticker}...")
        try:
            price_data = yf.download(yf_ticker, start=start_date, end=end_date, interval="1d")
            if not price_data.empty:
                # Extract 'Close' column, rename it to ticker name
                price_data = price_data['Close'].copy()
                price_data.rename(columns={'Close': yf_ticker}, inplace=True)

                # Align to common date range and forward-fill missing values
                price_data = price_data.reindex(common_date_range, method="ffill")
                price_data.index.name = 'date'  # Ensure index is named 'date'
                all_prices.append(price_data)
        except Exception as e:
            print(f"Failed to download data for {yf_ticker}: {e}")

    if all_prices:
        # Combine all prices into one DataFrame
        combined_prices = pd.concat(all_prices, axis=1).sort_index()
        combined_prices.reset_index(inplace=True)
        # combined_prices.reset_index([0, 1, 2])
        combined_prices.set_index("date", inplace = True)# Flatten index
        print("Currency prices downloaded and flattened successfully.")
        return combined_prices
    else:
        print("No currency prices were downloaded.")
        return pd.DataFrame()


# def get_ticker_value(row, currency_prices):
#     """
#     Safely retrieve the value from currency_prices for the given ticker and date.

#     Args:
#         row: A row of the filtered_df DataFrame (with 'YF_Ticker' column).
#         currency_prices: A DataFrame containing price data.

#     Returns:
#         A scalar value from currency_prices for the specified ticker and date, or None if not found.
#     """
#     ticker = row['YF_Ticker']
#     date = row.name[1]  # 'date' is the second level of the multi-index
#     try:
#         if ticker in currency_prices.columns and date in currency_prices.index:
#             # Use `.at` to ensure scalar access
#             return currency_prices.at[date, ticker]
#         else:
#             return None
#     except KeyError:
#         return None

# def map_currency_prices(filtered_df, currency_prices, ticker_mapping):
#     """
#     Maps Yahoo Finance prices to filtered_df based on ticker and date.
#     Handles multi-level currency_prices dataframe.
#     """
#     # Extract clean ticker names from currency_prices.columns
#     clean_columns = currency_prices.columns.droplevel(0)
#     currency_prices.columns = clean_columns

#     # Create an empty column for the mapped values
#     filtered_df['YF_Ticker_Values'] = None

#     # Iterate through the ticker mapping and populate prices efficiently
#     for cot_ticker, yf_ticker in ticker_mapping.items():
#         if yf_ticker in clean_columns:  # Ensure YF ticker exists in the prices dataframe
#             try:
#                 # Mask rows where 'ticker' matches and align 'date' with the currency_prices index
#                 mask = filtered_df.index.get_level_values('ticker') == cot_ticker
#                 filtered_df.loc[mask, 'YF_Ticker_Values'] = filtered_df.loc[mask].index.get_level_values('date').map(
#                     currency_prices[yf_ticker]
#                 )
#             except Exception as e:
#                 print(f"Failed to map prices for {cot_ticker} -> {yf_ticker}: {e}")

#     return filtered_df

# def get_currency_price(row, currency_prices, ticker_mapping):
#     """
#     Helper function to safely fetch the currency price for a given row.
#     Ensures that date and ticker are correctly matched.
#     """
#     ticker = ticker_mapping.get(row.name[0])  # Map COT ticker to YF ticker
#     date = pd.to_datetime(row.name[1])  # Ensure date is in datetime format

#     # Validate ticker and date before fetching
#     if ticker and ticker in currency_prices.columns:
#         if date in currency_prices.index:
#             return currency_prices.at[date, ticker]  # Fetch single scalar value safely
#     return None

def get_price(row, currency_prices):
    """
    Fetch price for a given ticker and date from a MultiIndex DataFrame.
    """
    yf_ticker = row['YF_Ticker']
    date = row.name[1]  # Second level of MultiIndex is 'date'
    try:
        # Use xs to extract the date level safely and fetch ticker value
        return currency_prices.xs(date).get(yf_ticker, None)
    except KeyError:
        return None
        
        
        
# def process_currency_cot_data(currency_prices):
#     """
#     Process currency and COT data, ensuring proper filtering and integration.
#     """
#     # try:
#         # Download and concatenate COT data for multiple years
#     df = pd.concat(
#             [pd.DataFrame(cot.cot_year(year, cot_report_type='traders_in_financial_futures_futopt'))
#              for year in range(2020, 2025)],
#             ignore_index=True
#         )
    

#          # Filter relevant rows based on tickers
#     filtered_df = df[df['Market_and_Exchange_Names'].isin(CURRENCY_COTS_TO_YF_TICKERS.keys())].copy()
#          # Rename relevant columns
#     filtered_df.rename(columns=RENAMING_DICT, inplace=True)


#     #     # Convert 'date' column to datetime and set MultiIndex
#     filtered_df['date'] = pd.to_datetime(filtered_df['date'], errors='coerce')
#     filtered_df.set_index(['ticker', 'date'], inplace=True)
#     filtered_df.sort_index(inplace=True)
#     filtered_df.drop(columns=COLUMNS_TO_DROP, inplace=True, errors='ignore')

#     numeric_columns = [
#             'Dealer Long', 'Dealer Short',
#             'Asset Manager Long', 'Asset Manager Short'
#         ]
        
#     for col in numeric_columns:
#             if col in filtered_df.columns:
#                 filtered_df[col] = pd.to_numeric(filtered_df[col], errors='coerce')

#         # Calculate new columns
#     filtered_df['Net Dealers'] = filtered_df['Dealer Long'] - filtered_df['Dealer Short']
#     filtered_df['Net Asset Managers'] = filtered_df['Asset Manager Long'] - filtered_df['Asset Manager Short']

#     #     # Ensure currency_prices has date as index
#     currency_prices.index = pd.to_datetime(currency_prices.index)

#     filtered_df['YF_Ticker_Values'] = filtered_df.apply(
#             get_currency_price, axis=1, args=(currency_prices, CURRENCY_COTS_TO_YF_TICKERS)
#         )
#     return filtered_df


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

def process_currency_cot_data(currency_prices):
    """
    Process currency and COT data, ensuring proper filtering and integration.
    """
    # try:
        # Download and concatenate COT data for multiple years
    df = pd.concat(
            [pd.DataFrame(cot.cot_year(year, cot_report_type='traders_in_financial_futures_futopt'))
             for year in range(2020, 2025)],
            ignore_index=True
        )



         # Filter relevant rows based on tickers
    filtered_df = df[df['Market_and_Exchange_Names'].isin(CURRENCY_COTS_TO_YF_TICKERS.keys())].copy()
         # Rename relevant columns
    filtered_df.rename(columns=RENAMING_DICT, inplace=True)


    #     # Convert 'date' column to datetime and set MultiIndex
    filtered_df['date'] = pd.to_datetime(filtered_df['date'], errors='coerce')
    filtered_df.set_index(['ticker', 'date'], inplace=True)
    filtered_df.sort_index(inplace=True)
    filtered_df.drop(columns=COLUMNS_TO_DROP, inplace=True, errors='ignore')

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

    #     # Ensure currency_prices has date as index
    currency_prices.index = pd.to_datetime(currency_prices.index)


        # Map YF_Ticker
    filtered_df['YF_Ticker'] = filtered_df.index.get_level_values('ticker').map(CURRENCY_COTS_TO_YF_TICKERS)
    
    # Map YF_Ticker_Values using the get_price function
    filtered_df['YF_Ticker_Values'] = filtered_df.apply(get_price, axis=1, args=(currency_prices,))
    
    return filtered_df
