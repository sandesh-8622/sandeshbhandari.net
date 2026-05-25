---
title: "how to scrape the internet"
description: "what it is, how it works, and how to build a scraper that does not fall apart"
publishDate: "2026-05-20"
tags: ["essays"]
---
*what it is, how it works, and how to build a scraper that does not fall apart*

A web browser does two jobs when it loads a page. It requests the page from a server, and it renders the response into something visible on screen. Web scraping is the first job without the second. A program sends the same request a browser would send, receives the same response a browser would receive, and then reads the content directly instead of drawing it.

The request itself is three lines of Python.

```python
import requests

response = requests.get("https://example.com")
print(response.text)   # the raw HTML, byte for byte what a browser receives
```

The text that comes back is HTML. It is the same HTML a browser would receive, because the server has no way of telling the difference and no reason to send anything else. Everything in web scraping after this point is the work of turning that flat text into structured data, and doing it in a way that keeps working when the network drops, the page changes, or the server decides it does not want to talk to a script.

## what actually happens during a request

Every page load follows the same structure, defined by the HTTP protocol. A client sends a request containing a method, a path, and a set of headers. A server returns a response containing a status code, headers, and a body.

```text
Request:   GET /path HTTP/1.1   ->  Server
Response:  Status code + Headers + Body   <-  Client
```

The status code is the first thing a scraper has to check, because it determines what to do before any HTML is examined. A code of 200 means the request succeeded and the body holds the page. A 301 or 302 means the page moved, and HTTP libraries follow these redirects automatically. A 403 means the server refused the request. A 404 means the page does not exist. A 429 means requests are arriving too quickly and the server is asking for a slower rate.

A scraper runs across thousands of pages, and it will meet all of these codes. Code that assumes every response is a 200 breaks the first time a server returns anything else, so the status check belongs in the scraper from the first version.

```python
response = requests.get(url)

if response.status_code == 200:
    html = response.text
elif response.status_code == 429:
    time.sleep(30)          # asked to slow down, so slow down
elif response.status_code in (403, 404):
    skip(url)               # refused or missing, do not retry forever
```

One practical check is worth doing before writing any scraper at all. Many large sites, including GitHub, Reddit, and Wikipedia, publish an API: an official endpoint that returns clean structured data instead of HTML. An API is faster to work with, far more stable when the site redesigns, and built for exactly this purpose. Scraping HTML when an API exists is extra work for a worse result.

## turning HTML into something queryable

HTML arrives as one long flat string, and a string cannot be queried. Before anything useful can happen, the string has to be parsed into a tree.

HTML is a tree by its nature. A document has a root element, which has children, which have children of their own, all the way down. A parser reads the flat text and rebuilds that structure in memory, so that instead of searching through characters, the program can navigate parents, children, and attributes. The standard tool for this in Python is BeautifulSoup.

```python
from bs4 import BeautifulSoup

soup = BeautifulSoup(html, "html.parser")   # or "lxml" for more speed

links   = soup.find_all("a", href=True)     # every hyperlink on the page
article = soup.find("article")              # the first <article> element
```

BeautifulSoup gives two core methods for finding elements by tag. `find` returns the first match. `find_all` returns a list of every match.

```python
soup.find("a")          # the first <a> tag
soup.find_all("a")      # a list of every <a> tag
```

Elements can also be located by class or by ID, which is how a scraper targets one specific part of a page rather than every tag of a type. The underscore in `class_` exists because `class` is a reserved word in Python.

```python
soup.find(class_="headline")        # first element with class "headline"
soup.find_all(class_="headline")    # all of them
soup.find(id="main-content")        # the element with id "main-content"
```

There is one mistake worth avoiding from the start. When `find` and `find_all` locate nothing, they return `None`, and pages change, so the element that was there last week may be gone today. Calling `.text` on a `None` crashes the scraper. The fix is a single check.

```python
headline = soup.find(class_="headline")
if headline is not None:
    print(headline.text)
```

## css selectors, and why they are usually better

BeautifulSoup can already find elements by class and ID, so it is fair to ask why anything else is needed. The reason becomes clear the moment a scraper needs an element that has no convenient class or ID, which is most of the time on a real page.

Suppose the goal is the score of each post on a news aggregator, and the score sits in a `<span>` with no useful class. Done with `find_all` and manual navigation, the code looks like this:

```python
results = []
for tr in soup.find_all("tr"):
    if len(tr.contents) == 2:
        if len(tr.contents[0].contents) == 0 and len(tr.contents[1].contents) == 13:
            score = tr.contents[1].text.split(" ")[0].strip()
            results.append(score)
```

It works, and it is also hard to read, fragile, and impossible to glance at and understand. A CSS selector collapses that whole loop into one expression.

```python
results = [el.text.split(" ")[0].strip()
           for el in soup.select("td:nth-child(2) > span:nth-child(1)")]
```

The selector `td:nth-child(2) > span:nth-child(1)` describes a structure directly: the first `<span>` that is a direct child of a `<td>` that is itself the second child of its parent. The `select` method returns every element matching a selector, and `select_one` returns the first. A few patterns cover most real cases:

```python
a > p              # every <p> that is a direct child of an <a>
a p                # every <p> anywhere inside an <a>
h2 + p             # the <p> immediately after an <h2>
p[data-id="x"]     # every <p> with attribute data-id="x"
section > p:last-child   # the last <p> directly inside a <section>
```

There is a debugging trick that removes most of the guesswork. Open the developer tools in a browser, open the search box inside the element inspector, and type a selector. The browser highlights what it matches. It also works in reverse: right-click an element, choose Copy and then Copy Selector, and the browser produces a selector targeting it. Those generated selectors tend to be overly specific and brittle, so they are a starting point to verify by hand rather than a finished answer.

## walking through every page

Most data worth collecting spans more than one page, so a scraper has to move from one page to the next and know when to stop.

The pattern is a loop that continues until there is no next page. On most paginated sites, the last page is the one without a "next" link, so the presence or absence of that link is the signal.

```python
import requests
from bs4 import BeautifulSoup

scraping = True
page = 1
collected = []

while scraping:
    response = requests.get(f"https://example.com/articles?p={page}")
    soup = BeautifulSoup(response.content, "html.parser")

    for article in soup.find_all(class_="article"):
        collected.append({
            "title": article.find(class_="title").get_text(),
            "url":   article.find("a").get("href"),
        })

    if soup.find(class_="next-page"):
        page += 1
    else:
        scraping = False
        print(f"Done. Collected {len(collected)} articles.")
```

Fetch a page, extract from it, look for a link to the next one, repeat. That shape is the backbone of nearly every multi-page scraper, and the only site-specific part is which selector marks the next page.

## rate limiting, and not overwhelming a server

A scraper sending requests as fast as Python can issue them sends hundreds of requests per second at a server built to serve a few hundred people per hour. For a small site that is a real burden, and for any site it is the fastest way to get an IP address blocked. The fix is a delay between requests, and it is the single most important habit in a scraper that has to keep working.

```python
import time

time.sleep(1.0)   # one full second between every request
```

It is worth seeing what that delay does to throughput. Over N requests with a delay of d seconds each, the effective rate settles to a simple limit:

```text
T  =  N / (N · d + overhead)   ≈   1 / d   as N grows large
```

At d = 1 second, that is roughly one page per second, or about 3,600 pages per hour. Collecting 1,500 pages takes about 25 minutes. That is slow to watch and it is the correct speed anyway, because a job that finishes quietly in 25 minutes is far better than one that finishes in two and gets the address banned for a month. When more speed is genuinely needed, concurrency helps, but it should be kept to a small number of simultaneous connections, in the range of two to five, with error rates watched closely. Rising errors or slowing responses mean the server is straining, and the correct response is to back off.

Speed is not the only reason scrapers get blocked. By default the `requests` library identifies itself in the User-Agent header as `python-requests`, which announces immediately that the client is a script, and some servers refuse that outright. Sending a realistic User-Agent solves it.

```python
headers = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}
response = requests.get(url, headers=headers)
```

## failing gracefully

A scraper that runs for 25 minutes will, at some point, hit something that breaks: a server that times out, a connection that drops, a single page that hangs. The wrong response is to retry instantly and forever, because a scraper hammering a struggling server with instant retries makes the problem worse and looks like an attack. The right response is exponential backoff: a limited number of retries, with a longer wait before each one.

```python
import time
import random

def fetch_with_retry(url, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()      # raises on 4xx and 5xx
            return response
        except requests.RequestException:
            if attempt == max_retries - 1:
                return None                  # give up after the last try
            wait = (2 ** attempt) + random.uniform(0, 1)
            time.sleep(wait)                 # 1s, then 2s, then 4s, plus jitter
```

The wait doubles each round, and the small random offset spreads retries apart so that many failed requests do not all retry at the same instant. Three to five attempts is a sensible ceiling. Something that fails five times with increasing patience between tries will not succeed on the sixth.

## saving progress

Long-running scrapers fail for reasons unrelated to the code. The network drops for thirty seconds at page 800. A laptop goes to sleep. A single site hangs until the timeout fires. A scraper that holds every result in memory and writes nothing until the end loses the whole run to any of these.

The cost is worth quantifying. Without checkpointing, the expected work lost to a crash is half the run multiplied by the time per page:

```text
E[loss]  =  (N / 2) · d
```

The fix is checkpointing: write partial results to disk every K iterations. Once that is in place, the worst case stops depending on the length of the run. The most that can be lost is K pages of work.

```python
if i % 50 == 0:
    with open("partial.json", "w") as f:
        json.dump(collected, f, indent=2)
```

With a checkpoint every 50 pages at one second per page, the worst possible loss is 50 seconds, whether the crash happens at page 100 or page 10,000. Combined with the habit of testing on five or ten pages before scaling to thousands, this removes most of the pain from long runs.

## choosing a data format

Once the data is collected it has to be stored, and the right format depends on the shape of the data and what happens to it next.

JSON imposes no schema, so a record with a date sits next to a record without one. That flexibility is its strength, and the cost is that JSON has no type system beyond strings, numbers, booleans, arrays, and objects, and querying it means loading the whole file into memory first.

```python
import json

with open("articles.json", "w", encoding="utf-8") as f:
    json.dump(collected, f, indent=2)
```

CSV is a flat grid where every row has the same columns. It is the right choice when the data genuinely is a flat grid, and the wrong choice for nested or irregular data, which it cannot represent cleanly.

```python
import csv

with open("articles.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["title", "url"])
    writer.writeheader()
    writer.writerows(collected)
```

JSON Lines, or JSONL, is one JSON object per line with no wrapping array. That small change has a large consequence: a file can be streamed line by line without loading it into memory.

```text
Memory usage:   O(1) for JSONL   vs.   O(N) for standard JSON
```

For any dataset too large for memory, or for machine-learning data where tools expect streaming access, JSONL is the right format. For a few thousand records read all at once, plain JSON is simpler and fine.

## when plain HTTP is not enough

Everything so far assumes the server sends the actual content in its first response. That holds for traditional sites. It does not hold for single-page applications, where the server sends a near-empty shell and JavaScript fills in the content inside the browser. A `requests.get()` against one of those returns something close to empty:

```html
<div id="root"></div>
```

The content was fetched and rendered by JavaScript that the scraper never executed. The fix is a tool that drives a real browser, lets the JavaScript run, and then returns the finished HTML. Playwright is the current standard.

```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto(url)
    page.wait_for_load_state("networkidle")   # let the JavaScript finish
    html = page.content()                     # the fully rendered HTML
    browser.close()
```

The cost is speed. Launching a headless browser takes seconds per page against milliseconds for a plain HTTP request, so a 1,500-page job that `requests` finishes in 25 minutes can take hours with full rendering. The rule that follows: use plain `requests` whenever the content is in the initial HTML, and reach for Playwright only when it genuinely is not. Checking is easy. Look at what `requests.get()` returns, and if the data is already there, no browser is needed.

## when a site fights back

Some sites actively try to tell scripts and humans apart. They inspect the TLS fingerprint, the order of the headers, and the pattern of requests, and a plain `requests` call has a signature that gives it away.

A category of tool exists for this. `curl_cffi` is a Python HTTP library that mimics the TLS fingerprint and header ordering of a real browser, which gets it past detection that blocks ordinary HTTP libraries.

```python
from curl_cffi.requests import get

response = get("https://example.com", impersonate="chrome")
print(response.status_code)
```

For harder cases, rotating proxies route each request through a different IP address, so no single address shows the request volume that triggers a block, and rotating the User-Agent across a small list of realistic strings adds another layer of variation.

There is a real line here, though. Making a scraper a well-behaved visitor is one thing. Defeating a login wall, a paywall, or a security system is a different thing with different legal weight. When a site is clearly working hard to keep scrapers out, that effort is the answer, and the sensible move is to request proper access or move on.

## the tools past the basics

`requests` and BeautifulSoup handle most scraping, and they are the right place to start. A few newer tools solve the specific problems that appear once a scraper has to run reliably and at scale.

`selectolax` is an HTML parser built on a Rust engine. It is far faster than BeautifulSoup, often by more than an order of magnitude, and supports CSS selectors with a clean interface. On a job parsing thousands of pages, that is the difference between minutes and seconds.

```python
from selectolax.parser import HTMLParser

tree = HTMLParser(html)
print(tree.css_first("p").text())
```

`respx` mocks HTTP requests, so a scraper can be tested without sending a single real request. Testing against a live site is slow, risks a block, and fails entirely when the site is down. With mocking, timeouts and specific responses can be simulated, and a full test suite runs offline.

`trafilatura` solves a problem the basic tools do not: pulling the actual article text out of a page, and only that text, leaving behind the navigation, the footer, the related-content widgets, and the cookie banner. It scores each element of the page with a function shaped like this:

```text
score(el)  =  text_length(el) / (1 + tag_count(el))  ·  position_weight(el)
```

A high amount of prose is a good sign, a high density of tags is a bad sign because menus are mostly tags with little text, and content in the center of the page outranks content at the edges. The element with the highest score that clears a minimum size is the article. In practice the formula is never computed by hand. It is one function call.

```python
import trafilatura

downloaded = trafilatura.fetch_url(url)
text = trafilatura.extract(downloaded, include_comments=False)
```

## the shape of a complete scraper

A full content scraper always has the same staged shape, where each stage turns less-structured input into more-structured output.

```text
discover URLs  ->  fetch pages  ->  extract content  ->  store data
   (index or         (requests,        (BeautifulSoup,     (JSON, CSV,
    listing)          backoff,          trafilatura)        or JSONL)
                      checkpoints)
```

The value of stages is that each one is independent and testable on its own. The discovery stage can be run and its URL list inspected before the network is touched at scale. The extraction stage can be run on a single page before running on ten thousand. Because the stages are separate, a failure in one does not cost the work of the others.

The code for any single stage is rarely more than 30 to 50 lines. The whole core stack, `requests`, `beautifulsoup4`, `lxml`, and `trafilatura`, adds up to roughly 200 lines for a complete scraper. The code is short. What takes the time is handling the cases that go wrong: the 403s, the timeouts, the empty extractions, the redirects to login pages, the pages that render in JavaScript, the dates that arrive in three different formats. The happy path is brief, and the reliability is all in the rest.

## a decision tree for picking an approach

For any new scraping task, the right tool is usually clear within a few questions.

```text
Need data from a website?
├── Is there an API?             ->  use the API
├── Is the content in the HTML?  ->  requests + BeautifulSoup
├── Rendered by JavaScript?      ->  Playwright
├── Heavy anti-bot defenses?     ->  curl_cffi, or reconsider
└── Behind a login or paywall?   ->  request access instead
```

## what it actually takes

The internet is a document store that never agreed on a schema. Every site has its own structure, its own conventions, and its own ideas about what HTML should look like. Scraping is the work of pulling consistent data out of that inconsistency, and the skill in it is not the code, because the code is short and most of it appears above. The skill is building a scraper that degrades instead of crashing: one that checks status codes, retries with backoff, checkpoints its progress, slows down when a server strains, and keeps running when it meets the parts of the web that do not cooperate. A scraper that works in a demo and a scraper that runs every morning without supervision are separated almost entirely by how they handle the things that go wrong.
