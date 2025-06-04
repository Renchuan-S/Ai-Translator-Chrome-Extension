import random
import time
import os

# Word categories and their corresponding words
word_database = {
    'Animals': ['elephant', 'giraffe', 'penguin', 'dolphin', 'kangaroo', 'octopus', 'cheetah'],
    'Countries': ['france', 'japan', 'brazil', 'australia', 'egypt', 'canada', 'india'],
    'Foods': ['pizza', 'sushi', 'burger', 'pasta', 'taco', 'pancake', 'cookie'],
    'Sports': ['soccer', 'tennis', 'basketball', 'volleyball', 'cricket', 'swimming']
}

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def display_word(word, guessed_letters):
    """Display the word with guessed letters revealed and others as underscores"""
    return ' '.join(letter if letter in guessed_letters else '_' for letter in word)

def play_game():
    # Select a random category and word
    category = random.choice(list(word_database.keys()))
    word = random.choice(word_database[category]).lower()
    guessed_letters = set()
    max_attempts = 6
    attempts_left = max_attempts
    
    print("\n=== Word Guessing Game ===")
    print(f"\nCategory: {category}")
    print(f"The word has {len(word)} letters")
    
    while attempts_left > 0:
        print("\n" + "="*40)
        print(f"\nWord: {display_word(word, guessed_letters)}")
        print(f"Attempts left: {attempts_left}")
        print(f"Guessed letters: {', '.join(sorted(guessed_letters))}")
        
        guess = input("\nGuess a letter or the whole word: ").lower()
        
        if guess == word:
            print("\nCongratulations! You guessed the word correctly!")
            return True
        
        if len(guess) == 1:
            if guess in guessed_letters:
                print("\nYou already guessed that letter!")
                continue
                
            guessed_letters.add(guess)
            
            if guess not in word:
                attempts_left -= 1
                print(f"\nWrong guess! The letter '{guess}' is not in the word.")
                if attempts_left == 0:
                    break
            else:
                print(f"\nGood guess! The letter '{guess}' is in the word!")
                
            # Check if all letters have been guessed
            if all(letter in guessed_letters for letter in word):
                print(f"\nCongratulations! The word was '{word}'!")
                return True
        else:
            print("\nInvalid input! Please enter a single letter or the complete word.")
    
    print(f"\nGame Over! The word was '{word}'.")
    return False

def main():
    while True:
        clear_screen()
        play_game()
        
        play_again = input("\nWould you like to play again? (yes/no): ").lower()
        if play_again != 'yes':
            print("\nThanks for playing! Goodbye!")
            break

if __name__ == "__main__":
    main() 