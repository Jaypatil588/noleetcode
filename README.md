WIP:
1. Screenshots can be directly sent to gemini without saving them first, because im sending base64 encoding anyway
2. gemini model can be finetuned to solve leetcode problems. I've tuned it on 500 most viewed problems so far, i need to train it further on harder problems next time.
3. Frontend is ass. Need to make cards to sectionize stuff properly.
4. Code area should have python linting.
5. Retry logic needs to be added on invalid response or incompatible JSON returns
6. Regenerate shortcut + logic needs to be added, which should provide user (me?) with an alternate code solution.
7. Can i also add a "follow up" mode? An input field to write follow up questions which gemini works on a responds to?

FUCK
Gemini model 1.5 which supports fine tuning does NOT support images.
What if i did OCR text extraction using model 2 from image and then used 1.5 fine tuned to solve? To be done later i guess?
