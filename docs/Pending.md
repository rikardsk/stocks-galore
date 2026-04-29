## TODOs
Notifications med badges for unread notifications
~~Tabell vy med alla stats för alla tickers och alla listor (inga dubletter)~~
Color background and/or badges
Bigger workbench
~~Export/Import~~
Grafer?
Dark/Light mode
~~Filter on % change?~~
~~Filter Moving Averages?~~
Zoom in/out with the mouse scroll wheel?
Edit Lists?
Edit Categories?
Database?
Earnings winners
Earnings date?


## Prompts
~~Can you do a new row in the stats to show, a row below the one with S20, S50 and S200, that gives me the percentage difference between the current price and the S20, S50 and S200? Green if the price is above, red if below.~~

~~Can you do a new row in the stats to show, a row below % thas says crossover and is YES or NO. YES if yesterdays close is beneath S20 (or which is in that column) and todays price is above it. If not it should say NO.~~

~~I want to be able to filter on % row (above or below) a certin % per column. And same for 1M, 3M and 1Y. Do you have any suggestion how we can do that in some easy way?~~
---------------------
The easiest and cleanest way to do this without cluttering up your Filter Modal with 12 new input boxes is to add a "Dynamic Rules" section to the global filter modal.

Here is how it would work:

We add an "Add Rule" button in the Filter Modal.
When you click it, a new row appears with three inputs:
A dropdown to pick the metric: SMA20 Distance, SMA50 Distance, SMA200 Distance, 1M Perf, 3M Perf, or 1Y Perf.
A dropdown for the condition: Above or Below (or Min/Max).
A number input for the percentage.
You can add as many rules as you want. For example, you could filter for 1M Perf > 5% AND SMA20 Distance < -2%.
~~Alternatively, if you prefer the simpler (but taller) approach, we could just add hardcoded Min and Max input boxes for all 6 of those metrics directly into the modal, just like we have for Price and Market Cap.~~

~~Which approach sounds better to you?~~

## Bugs


## Done
~~- Floating toggle button has been removed~~
~~- Dashboard button handles sliding the sidebar in and out.~~
~~- Press Enter to create your list~~
~~- Bulk additions for comma-separated list of tickers~~
~~- The 'X' button on a list panel should hide the panel instead of deleting it.~~
~~- Click on its name in the sidebar to make it visible again.~~
~~- Clicking on a list in the sidebar should toggle its visibility.~~
~~- Drag a ticker from one list and drop it into another.~~
~~- Ignore adding or dragging duplicate tickers.~~
~~- Copy tickers between lists instead of moving them when pressing Ctrl-button while dragging.~~
~~- Add button for toggling alphabetical sorting of the tickers in the list panels.~~
~~- Permanent  list named "Watchlist" that cannot be deleted.~~
~~- Make it possible to  organize your stock lists into collapsible categories.~~
~~- Add button "+ New Group" in the sidebar~~
~~- Add flag icons?~~
~~- Add country when creating a new list: "No Country", US, Canada, Sweden, Norway, Finland, Denmark, Germany, UK, France, Netherlands, Switzerland, Italy, Spain, Other~~
~~- Drag a group to reorder the groups.~~   
~~- Add count within parenthesis after list name and group name?~~
~~- If it's an "Unknown Company", don't show price or percentage change.~~
~~- Bullet in the header (green if refreshed in the last 24h, red if older)~~
~~- Can I get some animation on the refresh button while it's refreshing?~~
~~- What happens if there is an error fetching data? Can I see the error?~~
~~Can we add sector to the list of stats?~~
~~Why is 1Y always 0%?~~
~~Filter on market cap and on price? (Between if possible), also filter on sector~~
~~- Added a button between refresh and add new list for clearing the workbench~~
~~Change 1M, 3M, 1Y, 5Y~~
~~How far from SMA10, SMA20, SMA50, SMA100, SMA200?~~
~~Crossover~~


