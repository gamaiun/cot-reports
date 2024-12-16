
import sys
import os

from flask import Flask, jsonify, request
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
import yfinance as yf
import pandas as pd
import cot_reports as cot
from pandas.tseries.offsets import BDay
import base64
from utils.currencies_and_indexes import load_currency_data

# If you want to integrate with currencies_and_indexes.py, uncomment the line below
# from currencies_and_indexes import load_currency_data

app = Flask(__name__)
CORS(app)

data_cache_dir = "data_cache"
os.makedirs(data_cache_dir, exist_ok=True)

# Mapping for agricultural tickers
agri_cots_to_yf_tickers = {
    'WHEAT-SRW - CHICAGO BOARD OF TRADE': 'ZW=F',
    'WHEAT-HRW - CHICAGO BOARD OF TRADE':'ZW=F',
    'WHEAT-HRSpring - MINNEAPOLIS GRAIN EXCHANGE':'ZW=F',
    'CORN - CHICAGO BOARD OF TRADE': 'ZC=F',
    'OATS - CHICAGO BOARD OF TRADE': 'ZO=F',
    'SOYBEAN CSO - CHICAGO BOARD OF TRADE': 'ZS=F',
    'COTTON NO. 2 - ICE FUTURES U.S.': 'CT=F',
    'SUGAR NO. 11 - ICE FUTURES U.S.': 'SB=F',
    'COFFEE C - ICE FUTURES U.S.': 'KC=F',
}

# Commodity categories
gas_cots = [
    'EUR STYLE NATURAL GAS OPTIONS - NEW YORK MERCANTILE EXCHANGE',
    'HENRY HUB - NEW YORK MERCANTILE EXCHANGE',
    'HENRY HUB PENULTIMATE NAT GAS - NEW YORK MERCANTILE EXCHANGE'
]

agri_cots_list = [
    'COFFEE C - ICE FUTURES U.S.',
    'CORN - CHICAGO BOARD OF TRADE',
    'COTTON NO. 2 - ICE FUTURES U.S.',
    'OATS - CHICAGO BOARD OF TRADE',
    'SOYBEAN CSO - CHICAGO BOARD OF TRADE',
    'SUGAR NO. 11 - ICE FUTURES U.S.',
    'WHEAT-HRSpring - MINNEAPOLIS GRAIN EXCHANGE',
    'WHEAT-HRW - CHICAGO BOARD OF TRADE',
    'WHEAT-SRW - CHICAGO BOARD OF TRADE',
]

columns_to_drop = [
    "Open Interest (All)",
    "CFTC Contract Market Code", 
    "CFTC Market Code in Initials",
    "Open Interest (Old)",
    "Noncommercial Positions-Long (Old)",
    "Noncommercial Positions-Short (Old)",
    "Noncommercial Positions-Spreading (Old)",
    "Commercial Positions-Long (Old)",
    "Commercial Positions-Short (Old)",
    "Total Reportable Positions-Long (Old)",
    "Total Reportable Positions-Short (Old)",
    "Nonreportable Positions-Long (Old)",
    "Nonreportable Positions-Short (Old)",
    "Open Interest (Other)",
    "Noncommercial Positions-Long (Other)",
    "Noncommercial Positions-Short (Other)",
    "Noncommercial Positions-Spreading (Other)",
    "Commercial Positions-Long (Other)",
    "Commercial Positions-Short (Other)",
    "Total Reportable Positions-Long (Other)",
    "Total Reportable Positions-Short (Other)",	
    "Nonreportable Positions-Long (Other)",	
    "Nonreportable Positions-Short (Other)",	
    "Change in Open Interest (All)",	
    "Change in Noncommercial-Long (All)",	
    "Change in Noncommercial-Short (All)",	
    "Change in Noncommercial-Spreading (All)",	
    "Change in Commercial-Long (All)",	
    "Change in Commercial-Short (All)",	
    "Change in Total Reportable-Long (All)",	
    "Change in Total Reportable-Short (All)",	
    "Change in Nonreportable-Long (All)",	
    "Change in Nonreportable-Short (All)",	
    "% of Open Interest (OI) (All)",
    "% of Open Interest (OI) (Other)",	
    "% of OI-Noncommercial-Long (Other)",	
    "% of OI-Noncommercial-Short (Other)",	
    "% of OI-Noncommercial-Spreading (Other)",	
    "% of OI-Commercial-Long (Other)",	
    "% of OI-Commercial-Short (Other)",	
    "% of OI-Total Reportable-Long (Other)",	
    "% of OI-Total Reportable-Short (Other)",	
    "% of OI-Nonreportable-Long (Other)",
    "% of OI-Nonreportable-Short (Other)",
    "Traders-Total (Other)",
    "Traders-Noncommercial-Long (Other)",
    "Traders-Noncommercial-Short (Other)",
    "Traders-Noncommercial-Spreading (Other)",
    "Traders-Commercial-Long (Other)",
    "Traders-Commercial-Short (Other)",
    "Traders-Total Reportable-Long (Other)",
    "Traders-Total Reportable-Short (Other)",
    "Concentration-Gross LT =4 TDR-Long (Old)",
    "Concentration-Gross LT =4 TDR-Short (Old)",
    "Concentration-Gross LT =8 TDR-Long (Old)",
    "Concentration-Gross LT =8 TDR-Short (Old)",
    "Concentration-Net LT =4 TDR-Long (Old)",
    "Concentration-Net LT =4 TDR-Short (Old)",
    "Concentration-Net LT =8 TDR-Long (Old)",
    "Concentration-Net LT =8 TDR-Short (Old)",
    "Concentration-Gross LT =4 TDR-Long (Other)",
    "Concentration-Gross LT =4 TDR-Short(Other)",
    "Concentration-Gross LT =8 TDR-Long (Other)",
    "Concentration-Gross LT =8 TDR-Short(Other)",
    "Concentration-Net LT =4 TDR-Long (Other)",
    "Concentration-Net LT =4 TDR-Short (Other)",
    "Concentration-Net LT =8 TDR-Long (Other)",
    "Concentration-Net LT =8 TDR-Short (Other)",
    "Contract Units",
    "CFTC Contract Market Code (Quotes)",
    "CFTC Market Code in Initials (Quotes)",
    "CFTC Commodity Code (Quotes)",
    "CFTC Region Code",
    "CFTC Commodity Code",
    "% of Open Interest (OI)(Old)",	
    "% of OI-Noncommercial-Long (Old)",	
    "% of OI-Noncommercial-Short (Old)",	
    "% of OI-Noncommercial-Spreading (Old)",	
    "% of OI-Commercial-Long (Old)",	
    "% of OI-Commercial-Short (Old)",	
    "% of OI-Total Reportable-Long (Old)",	
    "% of OI-Total Reportable-Short (Old)",	
    "% of OI-Nonreportable-Long (Old)",	
    "% of OI-Nonreportable-Short (Old)",	
    'Traders-Total (All)',
    'Noncommercial Positions-Spreading (All)',
    '% of OI-Noncommercial-Spreading (All)',
    'Traders-Noncommercial-Spreading (All)',
    'Traders-Total (Old)',
    'Traders-Noncommercial-Long (Old)', 'Traders-Noncommercial-Short (Old)',
    'Traders-Noncommercial-Spreading (Old)',
    'Traders-Commercial-Long (Old)', 'Traders-Commercial-Short (Old)',
    'Traders-Total Reportable-Long (Old)',
    'Traders-Total Reportable-Short (Old)',
]

renaming_dict  ={
    'Market and Exchange Names': 'ticker',
    'As of Date in Form YYYY-MM-DD': 'date2',
    'Noncommercial Positions-Long (All)': 'Noncommercial Long',
    'Noncommercial Positions-Short (All)': 'Noncommercial Short',
    'Commercial Positions-Long (All)': 'Commercial Long',
    'Commercial Positions-Short (All)': 'Commercial Short',
    'Total Reportable Positions-Long (All)': 'Reportable Long',
    'Total Reportable Positions-Short (All)': 'Reportable Short',
    '% of OI-Noncommercial-Long (All)': '%OI-Noncommercial-Long',
    '% of OI-Noncommercial-Short (All)': '%OI-Noncommercial-Short',
    '% of OI-Commercial-Long (All)': '%OI-Commercial-Long',
    '% of OI-Commercial-Short (All)': '%OI-Commercial-Short',
    '% of OI-Total Reportable-Long (All)': '%OI-Reportable-Long',
    '% of OI-Total Reportable-Short (All)': '%OI-Reportable-Short',
    '% of OI-Nonreportable-Long (All)': '%OI-Nonreportable-Long',
    '% of OI-Nonreportable-Short (All)': '%OI-Nonreportable-Short',
    'Traders-Noncommercial-Long (All)': 'Traders-Noncommercial-Long',
    'Traders-Noncommercial-Short (All)': 'Traders-Noncommercial-Short',
    'Traders-Commercial-Long (All)': 'Traders-Commercial-Long',
    'Traders-Commercial-Short (All)': 'Traders-Commercial-Short',
    'Traders-Total Reportable-Long (All)': 'Traders-Total Reportable-Long',
    'Traders-Total Reportable-Short (All)': 'Traders-Total Reportable-Short',
    'Concentration-Gross LT = 4 TDR-Long (All)': 'Concentration 4 TDR-Long',
    'Concentration-Gross LT =4 TDR-Short (All)': 'Concentration 4 TDR-Short',
    'Concentration-Gross LT =8 TDR-Long (All)': 'Concentration 8 TDR-Long',
    'Concentration-Gross LT =8 TDR-Short (All)': 'Concentration 8 TDR-Short',
    'Concentration-Net LT =4 TDR-Long (All)': 'Concentration-Net 4 TDR-Long',
    'Concentration-Net LT =4 TDR-Short (All)': 'Concentration-Net 4 TDR-Short',
    'Concentration-Net LT =8 TDR-Long (All)': 'Concentration-Net 8 TDR-Long',
    'Concentration-Net LT =8 TDR-Short (All)': 'Concentration-Net 8 TDR-Short'
}

def download_gas_prices():
    ticker = "NG=F"
    start_date = "2020-01-01"
    end_date = pd.Timestamp.now().strftime("%Y-%m-%d")
    gas_price = yf.download(ticker, start=start_date, end=end_date, interval="1d")
    gas_price = gas_price[['Close']]
    gas_price.index = pd.to_datetime(gas_price.index)
    return gas_price

def download_agri_prices():
    unique_tickers = set(agri_cots_to_yf_tickers.values())
    agri_prices = {}
    start_date = "2020-01-01"
    end_date = pd.Timestamp.now().strftime("%Y-%m-%d")

    for yf_ticker in unique_tickers:
        print(f"Downloading price data for {yf_ticker}")
        price_data = yf.download(yf_ticker, start=start_date, end=end_date, interval="1d")
        price_data = price_data[['Close']]
        price_data.index = pd.to_datetime(price_data.index)
        price_data.rename(columns={'Close': f"{yf_ticker}_Close"}, inplace=True)
        agri_prices[yf_ticker] = price_data

    return agri_prices

def load_data():
    current_date_str = pd.Timestamp.now().strftime("%Y%m%d")
    agri_data_file = os.path.join(data_cache_dir, f"agri_data_{current_date_str}.h5")
    natgas_data_file = os.path.join(data_cache_dir, f"natgas_data_{current_date_str}.h5")

    if os.path.exists(agri_data_file) and os.path.exists(natgas_data_file):
        agri_multiindex = pd.read_hdf(agri_data_file, key='agri')
        gas_multiindex = pd.read_hdf(natgas_data_file, key='natgas')
        print("Loaded cached agricultural and natural gas data from HDF5 files.")
    else:
        # Load and preprocess COT data
        df = pd.concat([pd.DataFrame(cot.cot_year(i, cot_report_type='legacy_futopt')) for i in range(2020, 2025)], ignore_index=False)

        # Agricultural data processing
        agri_df = df[df['Market and Exchange Names'].isin(agri_cots_list)].copy()
        agri_df.drop(columns=columns_to_drop, inplace=True)
        agri_df.rename(columns=renaming_dict, inplace=True)
        agri_df['date2'] = pd.to_datetime(agri_df['date2'])

        common_date_range = pd.date_range(start="2020-01-01", end=pd.Timestamp.now(), freq=BDay())
        agri_prices = download_agri_prices()
        agri_multiindex = agri_df.set_index(['ticker', 'date2']).sort_index()

        for ticker, yf_ticker in agri_cots_to_yf_tickers.items():
            if yf_ticker in agri_prices:
                agri_multiindex = agri_multiindex.reset_index().merge(
                    agri_prices[yf_ticker], left_on="date2", right_index=True, how="left", suffixes=("", "_dup")
                ).set_index(['ticker', 'date2']).sort_index()
                agri_multiindex = agri_multiindex.loc[:, ~agri_multiindex.columns.str.endswith('_dup')]

        # Add custom net calculations for agri
        agri_multiindex['Net Traders Noncommercial'] = agri_multiindex['Traders-Noncommercial-Long'] - agri_multiindex['Traders-Noncommercial-Short']
        agri_multiindex['Net Traders Commercial'] = agri_multiindex['Traders-Commercial-Long'] - agri_multiindex['Traders-Commercial-Short']
        agri_multiindex['Net Commercial'] = agri_multiindex['Commercial Long'] - agri_multiindex['Commercial Short']

        agri_multiindex = agri_multiindex.groupby(level='ticker').apply(
            lambda x: x.reindex(common_date_range, level='date2').ffill()
        ).reset_index(level=0, drop=True)

        # Gas data processing
        gas_price = download_gas_prices()
        gas_multiindex = df[df['Market and Exchange Names'].isin(gas_cots)].copy()

        gas_multiindex.rename(columns={'Market and Exchange Names': 'ticker', 'As of Date in Form YYYY-MM-DD': 'date2'}, inplace=True)
        gas_multiindex.drop(columns=columns_to_drop, inplace=True)
        gas_multiindex.rename(columns=renaming_dict, inplace=True)
        gas_multiindex['date2'] = pd.to_datetime(gas_multiindex['date2'])
        gas_multiindex.set_index(['ticker', 'date2'], inplace=True)

        gas_multiindex = gas_multiindex.reset_index().merge(
            gas_price, left_on="date2", right_index=True, how="left", suffixes=("", "_dup")
        ).set_index(['ticker', 'date2']).sort_index()
        gas_multiindex.rename(columns={'Close': 'NG_Close'}, inplace=True)

        # Add custom net calculations for gas
        gas_multiindex['Net Traders Noncommercial'] = gas_multiindex['Traders-Noncommercial-Long'] - gas_multiindex['Traders-Noncommercial-Short']
        gas_multiindex['Net Traders Commercial'] = gas_multiindex['Traders-Commercial-Long'] - gas_multiindex['Traders-Commercial-Short']
        gas_multiindex['Net Commercial'] = gas_multiindex['Commercial Long'] - gas_multiindex['Commercial Short']

        gas_multiindex = gas_multiindex.groupby(level='ticker').apply(
            lambda x: x.reindex(common_date_range, level='date2').ffill()
        ).reset_index(level=0, drop=True)

        # Save to HDF5 cache
        agri_multiindex.to_hdf(agri_data_file, key='agri', mode='w')
        gas_multiindex.to_hdf(natgas_data_file, key='natgas', mode='w')

    return gas_multiindex, agri_multiindex

# Initial data load
gas_multiindex, agri_multiindex = load_data()
# currency_combined = pd.DataFrame()  # Initialize as empty globally

def initialize_data():
    global currency_combined
    print("Initializing currency data...")
    try:
        currency_combined = load_currency_data()  # Load data
        print(currency_combined.head())  # Debug: Print the first few rows
        print(currency_combined.columns)  # Debug: Print all column names
    except Exception as e:
        print("Error initializing currency data:", e)
        currency_combined = pd.DataFrame()  # Fallback to empty DataFrame

def scheduled_update():
    global gas_multiindex, agri_multiindex, currency_combined
    gas_multiindex, agri_multiindex = load_data()
    currency_combined = load_currency_data(force_refresh=True)

scheduler = BackgroundScheduler(timezone="America/New_York")
scheduler.add_job(scheduled_update, 'cron', day_of_week='fri', hour=15, minute=30)
scheduler.start()

@app.route('/')
def home():
    return "Welcome to the Flask App! API is ready."

@app.route('/api/data/currency_cots', methods=['GET'])
def get_currency_cot_data():
    ticker = request.args.get('ticker')
    column = request.args.get('column')
    if not ticker or not column:
        return jsonify({'error': 'Ticker or column not specified'}), 400
    try:
        cot_data = currency_combined.xs(ticker, level='ticker')
        if column not in cot_data.columns:
            return jsonify({'error': f'Column {column} not found for ticker {ticker}'}), 404

        data = cot_data.reset_index()[['date', column]].to_dict(orient='records')
        return jsonify(data)
    except KeyError:
        return jsonify({'error': f'Data not found for ticker {ticker}'}), 404



# SERVES CURRENCY FUTURE PRICES

@app.route('/api/data/currency_prices', methods=['GET'])
def get_currency_prices():
    """
    Serve historical currency prices for the top chart.
    """
    ticker = request.args.get('ticker')  # Requested ticker

    print(f"Request Params - Ticker: {ticker}")

    if not ticker:
        return jsonify({'error': 'Ticker not specified'}), 400

    try:
        # Ensure the `currency_combined` DataFrame is available
        print("currency_combined Columns:", currency_combined.columns)
        print("currency_combined Index:", currency_combined.index.names)
        print("currency_combined Sample:")
        print(currency_combined.head())

        # Filter data for the requested ticker
        if 'ticker' not in currency_combined.index.names:
            return jsonify({'error': "'ticker' is not part of the DataFrame index"}), 500

        # Use `.xs()` to filter by `ticker` in the index
        filtered_data = currency_combined.xs(ticker, level='ticker')

        if filtered_data.empty:
            return jsonify({'error': f"No data found for ticker: {ticker}"}), 404

        # Ensure we return YF_Ticker_Values
        if "YF_Ticker_Values" not in filtered_data.columns:
            return jsonify({'error': "'YF_Ticker_Values' column not found in data"}), 404

        # Format the response
        response_data = filtered_data[["YF_Ticker_Values"]].rename(
            columns={"YF_Ticker_Values": "value"}
        ).copy()
        response_data["time"] = response_data.index.astype(str)  # Convert index to string

        # Debug: Log the filtered response data
        print("Filtered Currency Prices Response Sample:")
        print(response_data.head())

        return jsonify(response_data[["time", "value"]].to_dict(orient="records"))

    except Exception as e:
        print(f"Error in /api/data/currency_prices: {e}")
        return jsonify({'error': str(e)}), 500



# SERVES CURRENCY COT REPORTS

@app.route("/api/data/currency_combined", methods=["GET"])
def get_currency_combined_data():
    ticker = request.args.get("ticker")
    column = request.args.get("column")

    # Log the request parameters
    print(f"Request Params - Ticker: {ticker}, Column: {column}")

    try:
        filtered_df = currency_combined.loc[
            currency_combined.index.get_level_values("ticker") == ticker
        ]

        # Log filtered data for debugging
        print(f"Filtered Data for Ticker {ticker}:")
        print(filtered_df.head())

        # Format and return response
        response_data = filtered_df[[column]].dropna().reset_index()
        response_data = response_data.rename(columns={"date": "time", column: "value"})
        print("Filtered Response Data Sample:")
        print(response_data.head())

        return response_data.to_json(orient="records")
    except KeyError as e:
        print(f"KeyError: {e}")
        return jsonify({"error": f"Ticker {ticker} or column {column} not found"}), 400



@app.route('/api/options/currency_combined', methods=['GET'])
def get_currency_combined_options():
    columns = currency_combined.columns.tolist()
    return jsonify({'columns': columns})



@app.route('/api/data/natgas', methods=['GET'])
def get_natgas_data():
    ticker = request.args.get('ticker')
    column = request.args.get('column')
    if ticker and column:
        filtered_data = gas_multiindex.xs(ticker, level='ticker')
        data = filtered_data.reset_index()[['date2', column]].to_dict(orient='records')
        return jsonify(data)
    return jsonify({'error': 'Ticker or column not specified'}), 400

@app.route('/api/options/natgas', methods=['GET'])
def get_natgas_options():
    tickers = gas_multiindex.index.get_level_values('ticker').unique().tolist()
    columns = gas_multiindex.columns.tolist()
    return jsonify({'tickers': tickers, 'columns': columns})

@app.route('/api/options/agri', methods=['GET'])
def get_agri_options():
    tickers = agri_multiindex.index.get_level_values('ticker').unique().tolist()
    columns = agri_multiindex.columns.tolist()
    return jsonify({'tickers': tickers, 'columns': columns})

@app.route('/api/data/agri', methods=['GET'])
def get_agri_data():
    ticker = request.args.get('ticker')
    column = request.args.get('column')
    if ticker and column:
        try:
            filtered_data = agri_multiindex.xs(ticker, level='ticker')
            yf_ticker = agri_cots_to_yf_tickers.get(ticker)
            if yf_ticker and yf_ticker in filtered_data.columns:
                columns_to_return = [column, yf_ticker]
                data = filtered_data.reset_index()[['date2'] + columns_to_return].to_dict(orient='records')
            else:
                data = filtered_data.reset_index()[['date2', column]].to_dict(orient='records')
            return jsonify(data)
        except KeyError:
            return jsonify({'error': 'Data not found for the specified ticker or column'}), 404
    return jsonify({'error': 'Ticker or column not specified'}), 400

if __name__ == "__main__":
    # Load data before running the app
    initialize_data()

    # Run the Flask app
    app.run(debug=True)