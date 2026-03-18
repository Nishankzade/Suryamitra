# SuryaMitra User Information Storage Guide

## Overview
SuryaMitra now saves and remembers **all personal information** you share with it across conversations. This includes:
- **Basic Info**: Name, Age, State, City, Occupation
- **Solar Setup**: Roof Size, Energy Needs, Solar System Details
- **Additional Context**: Any other important information you mention

---

## How Information Gets Stored

### 1. **Automatic Profile Save (Via Chat)**
When you mention information in chat, you can ask SuryaMitra to save it:

**Example:**
```
You: "Meri naam Nishank hai, main Punjab se hoon, aur mere ghar pe 500 sq ft ka roof hai. Mere liye 5 kW ka solar system cahiye."

SuryaMitra: "Waah bhai! Maine sab kuch save kar diya! 🌞
✅ Name: Nishank
✅ State: Punjab  
✅ City: [If mentioned]
✅ Roof Size: 500 sq ft
✅ Energy Needs: 5 kW
Aab ye sab baatein main yaad rakhunga aur har baar personalized suggestions dunga!"
```

### 2. **Manual Profile Update**
You can tell SuryaMitra to explicitly save your profile:

**Hindi:**
```
"Mera profile update kar de. Naam: Nishank, Age: 25, State: Maharashtra, City: Pune, Roof: 300 sq ft, Energy: 3kW"
```

**Punjabi:**
```
"Meri profile update kar. Naam: Ravi, Umar: 30, Rajya: Punjab, Shaher: Amritsar, Chhat: 450 sq ft"
```

**Gujarati:**
```
"Manu profile update kar. Naam: Amit, Vayapara: 28, Pradesh: Gujarat, Shaher: Ahmedabad, Chhap: 400 sq ft"
```

### 3. **Dashboard Information Modal**
When you first login or update your profile, a modal appears asking:
- ✅ Name
- ✅ Age

Fill these in and they get saved to your account!

---

## What Information is Stored

### User Profile Fields
| Field | Type | Example |
|-------|------|---------|
| **Name** | Text | Nishank, Ravi, Amit |
| **Age** | Number | 25, 30, 45 |
| **State** | Text | Maharashtra, Punjab, Gujarat |
| **City** | Text | Pune, Amritsar, Ahmedabad |
| **Occupation** | Text | Farmer, Homeowner, Student, Professional |
| **Roof Size** | Text | 500 sq ft, 600 sq ft, etc. |
| **Energy Needs** | Text | 5 kW, 3 kW, etc. |
| **Additional Info** | Long Text | Any other important details |

---

## Accessing Your Saved Information

### 1. **View Your Profile**
Ask SuryaMitra:
```
"Meri profile dikha de"
"Mere paas kya information save hai?"
"Show me my profile"
```

### 2. **In New Conversations**
Once saved, SuryaMitra automatically uses your info:
```
You: "Kya subsidy mil sakti hai?"

SuryaMitra: "Bilkul Nishank! Tu Maharashtra se hai aur tera roof 500 sq ft hai.
PM Surya Ghar Yojana ke tahet tu ye subsidy le sakta hai..."
[Uses your saved information automatically]
```

---

## How Information Persists

### Across Devices
✅ Desktop → Mobile: If you save info, it stays on your account  
✅ Mobile → Desktop: Same saved profile everywhere  
✅ After Logout: Info remains with your account

### Across Conversations
✅ Chat 1: You tell SuryaMitra you're from Punjab  
✅ Chat 2: New conversation - SuryaMitra still remembers you're from Punjab  
✅ Chat 3: Your entire profile is available

### Forever (Until You Change It)
Once saved, information stays in your account until:
- You explicitly ask SuryaMitra to change it
- You manually update it via profile settings

---

## Examples of Auto-Saving

### Scenario 1: First Time Chat
```
You: "Namaste! Mein Rajesh hoon, UP se hoon, aur mere ghar pe 10000 hours bijli savere ho jaati hai. Solar laga sakte ho?"

SuryaMitra: "Namaste Rajesh! 🌞 
Maine ye sab remember kar liya:
✅ State: Uttar Pradesh
✅ Energy Consumption: 10000 units/year

Ab tu mujhe batao, teri roof ka size kitna hai? Uss basis par main perfect system suggest karunga!"
```

### Scenario 2: Updating Information
```
You: "Pehle maine 3kW solar chahiye tha, lekin ab 5kW lena hai."

SuryaMitra: "Bilkul! Maine update kar diya - ab 5kW system pe focus karunga! 🔋
Tere liye ab ye scheme best rahegi..."
```

### Scenario 3: Using Saved Information
```
You (New Chat): "Kya mujhe PM Surya Ghar mil sakta hai?"

SuryaMitra: "Rajesh! Haan haan! Tu Uttar Pradesh se ho aur tera 10000 units/year consumption hai.
PM Surya Ghar ke under..."
[Automatically uses your saved state and energy consumption]
```

---

## Important Notes

⚠️ **Your Information is Private**
- Only you can see your saved profile
- Not shared with anyone
- Encrypted in the database

📝 **Corrections**
- Anytime you want to correct info, just tell SuryaMitra
- "Meri state galat hai, actually main Maharashtra se hoon"
- SuryaMitra will update automatically

🔄 **What Gets Saved Automatically**
- Information from chat conversations
- Profile updates via modal
- Information you explicitly ask to save

💾 **What Doesn't Get Saved**
- Random messages that aren't about you
- Temporary thoughts/comments
- Questions you ask (only answers you provide)

---

## Commands to Manage Your Profile

| Command | Purpose |
|---------|---------|
| "Meri profile dikha de" | Show your full saved profile |
| "Mera naam change kar" | Update your name |
| "Mera state UP hai" | Update your state |
| "Meri information delete kar" | Clear all saved data |
| "Profile export kar" | Get a summary to save elsewhere |

---

## Troubleshooting

**Q: Meri information save nahi ho rahi?**  
A: Check if you're logged in. Save only happens for authenticated users.

**Q: Purani information use nahi ho rahi?**  
A: Try refreshing the page or starting a new conversation.

**Q: Galat information save ho gaya?**  
A: Tell SuryaMitra the correct info and ask to update: "Ye galat hai, actually..."

**Q: Information kaise delete karu?**  
A: Ask: "Meri saved information delete kar de"

---

This system ensures that **every piece of information you share is remembered and used to provide personalized help!** 🌞
