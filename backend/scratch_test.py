import re
import sys

def sanitize_message(text: str) -> str:
    if not text:
        return text

    # 1. Regex to match phone numbers (e.g. 8 to 15 digits, optionally separated by spaces, dashes, dots, or parentheses)
    # Matches digit sequences with separators that have between 8 and 15 digits in total.
    phone_pattern = re.compile(
        r'\+?\(?\d\)?(?:\s*[-.\(\)]?\s*\d){7,14}\b'
    )
    text = phone_pattern.sub("[REDACTED PHONE]", text)
    
    # 2. Regex to match potential 6-digit Indian PIN codes or 5-digit US Zip codes
    pin_pattern = re.compile(r'\b\d{5,6}\b')
    text = pin_pattern.sub("[REDACTED PIN]", text)

    # 3. Common address keywords and street numbers
    address_keywords = [
        r"street", r"road", r"lane", r"sector", r"apartment", r"apt", 
        r"building", r"house no", r"h\.no", r"flat no", r"cross", 
        r"nagar", r"colony", r"bazar", r"pincode", r"pin code"
    ]
    # For each keyword, match the keyword itself and any following numbers, hash signs, or single character/word identifiers (like 'Building A', 'Flat 4B')
    for keyword in address_keywords:
        pattern = re.compile(rf'\b{keyword}\b(?:\s*(?:no\.?|number)?\s*#?\s*\d*\w*)?', re.IGNORECASE)
        text = pattern.sub("[REDACTED ADDRESS]", text)
        
    return text

def test_sanitization():
    print("Testing message sanitization logic...")
    
    test_cases = [
        # Phone numbers
        ("Call me at 9876543210 tomorrow.", "Call me at [REDACTED PHONE] tomorrow."),
        ("My number is +91 99999-88888.", "My number is [REDACTED PHONE]."),
        ("Send it to +1 (555) 123-4567", "Send it to [REDACTED PHONE]"),
        ("Is 1234567890 your number?", "Is [REDACTED PHONE] your number?"),
        
        # Pincodes
        ("My PIN is 560001.", "My PIN is [REDACTED PIN]."),
        ("Zip code: 10001", "Zip code: [REDACTED PIN]"),
        
        # Addresses
        ("I live in flat no 4B, lane 2, sector 5, near market.", 
         "I live in [REDACTED ADDRESS], [REDACTED ADDRESS], [REDACTED ADDRESS], near market."),
        ("Let's meet at cross street 5.", "Let's meet at [REDACTED ADDRESS][REDACTED ADDRESS]."), # cross street 5 is fully redacted
        ("My address is road number 12, building A.", "My address is [REDACTED ADDRESS], [REDACTED ADDRESS]."),
    ]
    
    success = True
    for text, expected in test_cases:
        sanitized = sanitize_message(text)
        if sanitized == expected:
            print(f"PASS: '{text}' -> '{sanitized}'")
        else:
            print(f"FAIL:\n  Input:    '{text}'\n  Expected: '{expected}'\n  Got:      '{sanitized}'")
            success = False
            
    if success:
        print("\nAll sanitization test cases passed successfully!")
    else:
        print("\nSome test cases failed.")
        sys.exit(1)

if __name__ == "__main__":
    test_sanitization()
