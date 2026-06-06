## TODOs


## Later maybe
- Check code quality and fix errors...
- Save the sorting option of all labels (pinned, groups, ungrouped, archive) in the sidebar.
- Send e-mail as option to notifications instead of push-notifications. This should be a global setting.
- In the deep dive panel, add shortcut button for creating alerts when crossing SMAs.
~~- Make sure that newly created lists doesn't spawn under the sidebar.~~
~~- Add tag for "Not profitable", "Low debt", "High debt", "Dividend", " Growth".~~
~~- Sort by price as an option when choosing sorting method on lists (Ctrl + Shift + P).~~
~~- Some way to show if the company is profitable or not (Tag: Not profitable).~~
- Some way to show how much debt the company has (Tag: Low debt / High debt).
- Be able to move/drag the button bar at the bottom. And dock it to top, bottom, right but not left.
- Custom menu on right click. (As an option in settings modal).
- Is it possible to show the price of Bitcoin and Etherum?
- Be able to show/hide columns in Market Overview Table.
- % vs Earnings? (Earnings flagged as % or both?).
- Kebab style buttons for managing groups and lists in the sidebar. (3 vertical dots with a menu).
- Auto delete after a certain time period (eg 1 month).
- Auto create lists for last month with top performing stocks.
- Add a portfolio button that opens up a portfolio modal to manage Quantity and Average Price per ticker. The modal should also include  the Gain/Loss in numbers and percentages.
- Select a single notification to view details or delete it.
- Hover button to delete notification
- Zoom in/out with the mouse scroll wheel
~~- Earnings winners/dates~~
- Newsfeed?
~~- Database integration~~

## Done
~~- Include the latest price in the graph in the deep dive modal (toggable and appended to historical series)~~
~~- Earnings calendar modal showing Yesterday, Today, + 3 nextcoming days with filters and detail views, triggered by a floating action button~~
~~- Stock Deep Dive Modal (Interactive charts & fundamentals)~~
~~- Analytics dashboard with market cap histogram~~
~~- Sector analysis (Donut chart)~~
~~- Ranking system (Top 10 winners for 1M, 3M, 1Y)~~
~~- Company information (Expandable "About" descriptions)~~
~~- Progress bar during refresh~~
~~- Sparkline~~
~~- Crossover SMA technicals~~
~~- Moving Average distance stats (SMA10-200)~~
~~- Performance periods (1M, 3M, 1Y)~~
~~- Market cap & Price filtering~~
~~- Sector filtering~~
~~- Clear Workbench button~~
~~- Bulk additions for tickers~~
~~- Drag and drop tickers between lists~~
~~- Multi-list workbench with persistent sidebar~~
~~- Watchlist & Portfolio static sections~~
~~- Average gain tracking in headers~~
~~- Table view with global export/import~~
~~- Flag icons & Country selection~~
~~- Collapsible groups/categories~~
~~- Error handling and stale data indicators~~
~~- Ticker name wrapping (2 lines with ellipsis)~~
~~- Actionable Notifications (Direct link to charts)~~
~~- Animations on refresh and UI transitions~~
~~- Dark/Light mode~~
~~- Remove drag-and-drop from the sidebar and find some other way to assign a list to a group. Maybe we could add a +-sign next to the trashcan in the sidebar for each list, that opens a modal to assign an existing list to a group or create a new list.~~
~~- Add a group dropdown menu in the Create New List modal to assign a list to a group.~~
~~- Align the average percentage change values to the right in the sidebar list headers.~~
~~- Button for un-grouping a list, and move it to "Uncategorized".~~
~~- Break long list names into two lines with a hyphen or use "..." at the end when showed in the workbench. Example: Rare Earth Metals, or Small Nuclear Reactors or Asset Management, Waste Management.~~
~~- Add a copy button next to the "+ Add Ticker" button in the bottom of a list in the workbench, the button copies all the tickers in that list as a comma separated string (to clipbook) so i can paste it into a new list or Excel~~
~~- In the sidbar in lightmode the text is white on a white background, i assume the text should be black instead~~
~~- Sometimes the notifications are not marked as read after clicking on them in the notifications tab (THULE.ST, VIT-B.ST, CORT).~~
~~- Is it possible to add custom info badges on lists in the workbench that shows general info about the stocks in the list. (Eg. EB or EM for earnings beat or earnings miss, Prod. for new product etc. Or a custom tag for the list. Basically a reason for the latest price movement). The badges would be managed in the "deep dive" panel~~
~~- I want to do a scatter plot of stock companies with market cap on x-axis and 1-year gains on y-axis and put it in the analytics dashboard. Maybe with trendlines for each sector? and a way to hover over the dots to see the ticker symbol and company name, and click on the dot to open the stock deep dive modal~~
~~- Edit Lists/Categories~~
~~- Could you add SMA10 and SMA100 in the "deep dive" panel with the graph~~
- ~~Some way to rearrenge the groups. Up/Down arrows for moving groups up or down in edit mode~~
- ~~Present the number of groups in the label "GROUPS" and number of lists in the label "UNGROPED". (eg. GROUPS (2) and UNGROPED (1)).~~
- ~~Possibility to rename groups or lists in edit mode and change theme color for lists.~~
- ~~Remove the section "drop lists here" when creating a new group. Since it is not possible to move an existing list to a group (only to move lists between groups), the section is not needed.~~
- ~~When you click on a list in the sidebar and it's showing up in the workbench, could you scroll to the right list in the workbench so that the list is visible.~~
- ~~Only start search if 3 characters has been entered. Ie. an Enter press should not trigger a search if the ticker is less than 3 characters long and also be able to search for tags.~~
- ~~Toggle buttons for Earning Beat/Miss tags in the "deep dive" panel.~~
- ~~Top 10 Today in the ranking modal~~
- ~~Is it possible to just write the company name in the "add ticker" section at the bottom of the list, then the app tries to find the company via the company name. If there is only one result it adds it, if there is more than one result it opens a modal to choose the correct company from the results. Same logic could apply to the "Add Ticker" button in the top right corner.~~
- ~~Hide/Show the whole group section when you click the label GROUPS.~~
- ~~Hide/Show the whole lists section when you click the label UNGROPED.~~
- ~~A refresh button in the list next to the + Add Ticker button. The refresh button should only refresh the list in question.~~
- ~~Add Alert management (Add/Delete) directly in the "Deep Dive" panel.~~
- ~~Add Earnings Date to Market Overview table and Deep Dive panel.~~
~~- Earnings dates (for tracking upcoming earnings in the deep dive panel)~~
~~- IPO dates~~
~~- Can you add IPO date to Market Overview Table and Deep dive panel~~
~~- Graph for IPO date?~~
~~- The "Remove from portfolio" button in Portfolio list doesn't work.~~
~~- In the logs it looks like it's getting almost all ipo dates, it's just that it doesn't show in deep dive panel or market overview.~~
~~- Warning when clicking on Clear All in the notifications tab.~~
~~- Add a new list named Today in the sidebar under PINNED, under Portfolio.~~
~~- Align price in lists in the workbench to the right.~~
~~- Add a delete button in the notification modal to remove selected notifications from the list. Repurpose the Clear All button (?).~~
~~- Add a note section in the deep dive modal to add custom notes for each ticker.~~ 
~~- Add %-gain to the sort button on the lists in the workbench.~~
~~- Add the same sort button (as in the lists in the workbench) to the sidebar (ungrouped, archive only) after the headings, right centered.~~
~~- Can you make so that the pinned lists can move freely in the workbench like the rest of the lists.~~
~~- Add a 52-week slider filter together with above/below toggle buttons in the notifications modal.~~
~~- Add a P/E ratio filter with above/below toggle buttons in the notifications modal.~~
~~- Add a volume vs avg. volume filter with 2x, 3x, 4x, 5x+ buttons in the notifications modal.~~
~~- Display daily volume in parentheses after average volume in the deep dive modal.~~
~~- Sort button for PINNED, and GROUPS, like the others have.~~
~~- Crossover SMA 20/50, SMA 50/200.~~
~~- In the Market Overview Table after Chage % can you add P/E and after Sector can you add 52 week range.~~
~~- In settings modal can you do two toggle buttons for tuning on/off the crossover of SMA10 and SMA20 in the Notifications. If turned off it should not be calculated and notified. Can you also make some visual adjustment in Notifications modal if turned off so the user knows (like dim or some color or icon)~~
~~- Can you do shortcut keys for all the buttons on the buttonbar and update the current tooltip to show the shortcut. Ctrl-v for toggle sidebar,Ctrl-r to refresh, Ctrl-delete to clear, Ctrl-t for Market Table, Ctrl-a for anaytics, Ctrl-l for add new list, Ctrl-r for ranking, Ctrl-e for earnings calendar, Ctrl-x for search, Ctrl-f for filter, Ctrl-n for notifications, Ctrl-s for Settings.~~
~~- Ctrl + Del as a shortcut to clear the workbench, same as pressing the button(with confirmation).~~
~~- In the settings modal, can you make a toggle button to show/hide the buttonbar.~~
~~- In the settings modal, can you make it possible to choose buttonbar position (bottom, top, right) in settings. Bottom is the default.~~
~~- Can you make the search text field in the button bar longer? and make so esc also cancels the search action (same as clicking the x).~~
~~- Can you add "Copy" button in the header of all the lists in Top Performers modal. Copy as comma separated list of tickers that can be used to create a new list.~~
~~- Toggle sidebar should slide out from the right instead of pushing the content to the left (absolute positioning).~~
~~- Adjust the Z-index so that when moving a list by drag and drop it is always on top of the other lists (now sometimes it's behind some of the lists). The last shown/added list should always be on top.~~
~~- In the settings modal could you also do toggle buttons to show/hide the Pinned, Groups, Ungrouped and Archive sections in the sidebar.~~
~~- Can you make so a new list doesn't spawn under the sidebar but a bit more to the right of the sidebar.~~
~~- Make the sorting of pinned lists stable when clicked or focused so they do not reorder to the bottom of the section in the sidebar.~~
~~- When adding a ticker to a list in the workbench, check if the ticker already exists in the portfolio-list or watchlist-list and highlight those icons acordingly ("Remove from portfolio" icon and the "Remove from watchlist" icon).~~
~~- Make the sorting of all sidebar lists stable when clicked or focused so they do not reorder/swap places (e.g. Test4 and Test5).~~
~~- Can you make the vertical spacing even between the 4 labels in the sidebar (when collapsed they look slighlty missaligned).~~
~~- Change shortcut key for "Open Analytics" to Ctrl + a and change the Notifications shortcut key to Ctrl + Shift + n. Update the keyboard shortcuts modal to reflect the changes.~~
~~- Create shortcut keys for "Add group" as Ctrl + Alt + G, "Delete list" as Ctrl + D, and "Move list" as Ctrl + M. Update the keyboard shortcuts modal.~~
~~- Earnings in filter modal doesn't show a badge on the button in the buttonbar when activated.~~
~~- In the "Global Item Filters" modal, can you add a slider for filtering percentage gain/loss with to buttons above/below. Also add buttons to choose timeframe: today, 1M, 3M, 1Y.~~
~~- Can you use the Storage Estimate API to monitor localStorage usage and how full it is. (What's the limit?) and show some warning if it's getting full. Also can you create a donut chart in the analytics dashboard showing localStorage usage for different categories.~~
~~- Some way to monitor localStorage usage and how full it is. (What's the limit?).~~
~~- In the "Deep Dive" panel add another shortcut button under section for custom badges, next to note that says "Not profitable". The tag should be red like "Earnings Miss". Add the tag when the company's P/E is N/A.~~
~~- Is it possible to migrate the localStorage to IndexedDB instead since the storage is getting close to the 5MB limit, and the application is getting more and more complex with more features? Is it possible to add caching to reduce load times or is that already done.~~
~~- In settings modal, add a toggle button to show/hide tags in the lists in the workbench.~~
~~- In the create new group modal can you add a list of all existing groups and make it possible to delete and edit them. Also if possible to rearrenge them. Add a new button to add a new group in that modal, so that you can add multiple times in a row. (So that you don't need to close the modal to add a new group).~~


