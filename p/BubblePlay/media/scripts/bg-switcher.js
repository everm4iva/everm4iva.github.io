// Background and image configurations for each number (1-7)
const backgroundConfigs = {
    1: {
        bgCover: "url('../images/SlumberParty.jpg')",
        imgSrc: './media/images/Player-SlumberParty.png'
    },
    2: {
        bgCover: "url('../images/CigarettesOutTheWindow.jpg')",
        imgSrc: './media/images/Player-CigarettesOutTheWindow.png'
    },
    3: {
        bgCover:  "url('../images/FeelItStill.jpg')",
        imgSrc: './media/images/Player-FeelItStill.png'
    },
    4: {
        bgCover:  "url('../images/ICanTalk.jpg')",
        imgSrc: './media/images/Player-ICanTalk.png'
    },
    5: {
        bgCover:  "url('../images/LottaTrueCrime.jpg')",
        imgSrc: './media/images/Player-LottaTrueCrime.png'
    },
    6: {
        bgCover:  "url('../images/SeeYouAgain.jpg')",
        imgSrc: './media/images/Player-SeeYouAgain.png'
    },
    7: {
        bgCover:  "url('../images/Sympathize.jpg')",
        imgSrc: './media/images/Player-Sympathize.png'
    }
};

// Function to switch background and image
function switchBackground() {
    // Generate random number between 1 and 7
    const randomNumber = Math.floor(Math.random() * 7) + 1;
    
    // Get the configuration for the selected number
    const config = backgroundConfigs[randomNumber];
    
    // Update CSS custom property --bg-cover
    document.documentElement.style.setProperty('--bg-cover', config.bgCover);
    
    // Update image source
    const imgElement = document.getElementById('img');
    if (imgElement) {
        imgElement.src = config.imgSrc;
    }
}

// Execute when page loads
window.addEventListener('load', switchBackground);
