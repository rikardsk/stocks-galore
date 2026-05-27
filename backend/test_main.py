import unittest
import pandas as pd
import numpy as np
from main import calculate_stats

class TestSMACrossovers(unittest.TestCase):
    def test_crossover_sma20_sma50(self):
        # We need at least 50 periods of data for yesterday to compute SMA50.
        # Let's create Close prices such that yesterday SMA20 < SMA50 but today SMA20 > SMA50.
        prices = [100.0] * 50 + [90.0] + [150.0]
        dates = pd.date_range(end='2026-05-27', periods=52)
        hist = pd.DataFrame({'Close': prices}, index=dates)
        
        info = {
            'longName': 'Test Apple',
            'volume': 1000000,
            'marketCap': 1000000000,
            'sector': 'Technology'
        }
        
        stats = calculate_stats('AAPL', info, hist)
        
        # Verify today's SMA values
        sma20_series = hist['Close'].rolling(window=20).mean()
        sma50_series = hist['Close'].rolling(window=50).mean()
        
        sma20_today = sma20_series.iloc[-1]
        sma50_today = sma50_series.iloc[-1]
        sma20_yesterday = sma20_series.iloc[-2]
        sma50_yesterday = sma50_series.iloc[-2]
        
        # Print for sanity check
        print(f"Yesterday SMA20: {sma20_yesterday}, SMA50: {sma50_yesterday}")
        print(f"Today SMA20: {sma20_today}, SMA50: {sma50_today}")
        
        self.assertTrue(sma20_yesterday < sma50_yesterday)
        self.assertTrue(sma20_today > sma50_today)
        self.assertTrue(stats.get('crossover_sma20_sma50'))

    def test_crossover_sma50_sma200(self):
        # We need at least 200 periods of data for yesterday to compute SMA200.
        # Let's create Close prices such that yesterday SMA50 < SMA200 but today SMA50 > SMA200.
        prices = [100.0] * 200 + [90.0] + [180.0]
        dates = pd.date_range(end='2026-05-27', periods=202)
        hist = pd.DataFrame({'Close': prices}, index=dates)
        
        info = {
            'longName': 'Test Corp',
            'volume': 2000000,
            'marketCap': 2000000000,
            'sector': 'Finance'
        }
        
        stats = calculate_stats('TEST', info, hist)
        
        # Print for sanity check
        sma50_series = hist['Close'].rolling(window=50).mean()
        sma200_series = hist['Close'].rolling(window=200).mean()
        sma50_today = sma50_series.iloc[-1]
        sma200_today = sma200_series.iloc[-1]
        sma50_yesterday = sma50_series.iloc[-2]
        sma200_yesterday = sma200_series.iloc[-2]
        
        print(f"Yesterday SMA50: {sma50_yesterday}, SMA200: {sma200_yesterday}")
        print(f"Today SMA50: {sma50_today}, SMA200: {sma200_today}")
        
        self.assertTrue(sma50_yesterday < sma200_yesterday)
        self.assertTrue(sma50_today > sma200_today)
        self.assertTrue(stats.get('crossover_sma50_sma200'))

if __name__ == '__main__':
    unittest.main()
