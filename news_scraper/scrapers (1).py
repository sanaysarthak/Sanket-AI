import requests
import feedparser
from bs4 import BeautifulSoup
import random
import time
from datetime import datetime

# User Agents to avoid simple blocking
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
]

def get_headers():
    return {'User-Agent': random.choice(USER_AGENTS)}

def scrape_reddit(subreddit="jaipur", limit=5):
    """
    Scrapes the top posts from a subreddit using the public JSON API.
    """
    url = f"https://www.reddit.com/r/{subreddit}/new.json?limit={limit}"
    results = []
    try:
        response = requests.get(url, headers=get_headers(), timeout=10)
        if response.status_code == 200:
            data = response.json()
            posts = data.get('data', {}).get('children', [])
            for post in posts:
                p = post.get('data', {})
                results.append({
                    "source": "reddit",
                    "author": f"u/{p.get('author')}",
                    "content": p.get('title') + " " + p.get('selftext', '')[:100],
                    "timestamp": datetime.fromtimestamp(p.get('created_utc', time.time())).isoformat(),
                    "url": f"https://reddit.com{p.get('permalink')}"
                })
        else:
            print(f"Reddit scrape failed: {response.status_code}")
    except Exception as e:
        print(f"Error scraping Reddit: {e}")
    return results



def scrape_google_news(query="Jaipur"):
    """
    Scrapes Google News RSS for a specific query.
    """
    encoded_query = requests.utils.quote(query)
    url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-IN&gl=IN&ceid=IN:en"
    results = []
    try:
        feed = feedparser.parse(url)
        for entry in feed.entries[:5]:
            results.append({
                "source": "news",
                "author": entry.source.title if hasattr(entry, 'source') else "Google News",
                "content": entry.title,
                "timestamp": datetime.now().isoformat(), # RSS parsing can be tricky for time, simplified
                "url": entry.link
            })
    except Exception as e:
        print(f"Error scraping Google News: {e}")
    return results

def run_all_scrapers():
    """
    Runs all scrapers and returns aggregate data.
    """
    print("Starting Multi-Source Scrape...")
    all_data = []
    
    # 1. Reddit r/jaipur
    print("Scraping Reddit r/jaipur...")
    all_data.extend(scrape_reddit("jaipur"))
    
    # 2. News "Jaipur"
    print("Scraping Google News 'Jaipur'...")
    all_data.extend(scrape_google_news("Jaipur"))
    
    # 3. News/Social "Nagar Nigam Jaipur" (Proxy via News as direct X scraping is blocked)
    print("Scraping News for 'Nagar Nigam Jaipur'...")
    all_data.extend(scrape_google_news("Nagar Nigam Jaipur"))

    # Shuffle for the "live feed" feel
    random.shuffle(all_data)
    return all_data
