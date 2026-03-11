# GeoFS Smooth Cinematic Camera

A high-fidelity camera modification for  [GeoFS](https://www.geo-fs.com/)  designed to provide a "cinematic" feel. This script adds physical weight and momentum to camera movements, smooths out zoom transitions, and introduces advanced features like Dynamic Zoom.

----------

## Key Features


- **Smooth camera movement**
  - Smooths camera movement for the ultimate GeoFS experience
- **Integrated settings**
  - Settings are integrated with the GeoFS UI.

See it in action in [this video](https://www.youtube.com/watch?v=3GqDLJbesvQ).

[![Video Thumbnail Alt Text](https://img.youtube.com/vi/3GqDLJbesvQ/0.jpg)](https://www.youtube.com/watch?v=3GqDLJbesvQ)


----------

## Installation

### Option 1: Console

1. Copy the code from `Smooth Camera.js`.
   
2. Open the javascript console in your browser. (F12 in chrome or ⌥⌘C in Safari)
   
3. Paste the code in the console and press Enter.

### Option 2: Tampermonkey

1.  Install the  [Tampermonkey extension](https://www.tampermonkey.net/)  for your browser.
    
2.  Create a new script and paste the contents of  `Smooth Camera.js`.
    
3.  Save the script and refresh GeoFS.
    

### Option 3: Bookmarklet

1.  Create a new bookmark in your browser.
    
2.  In the  **URL**  or  **Location**  field, paste the following:
```javascript
    javascript:(() => {
    var liveryScript = document.createElement('script');
    liveryScript.src = "https://raw.githack.com/cesjn/GeoFS-Smooth-Cam/main/Smooth%20Camera.js";
    document.body.appendChild(liveryScript);
    liveryScript.onload = () => { console.log('Livery Selector loaded!'); };
    })();
```
    
4.  Save the bookmark and launch GeoFS.
5.  Click the bookmark once while you are in the GeoFS game to load the settings.


----------

## Configuration

Once installed, open the  **GeoFS Preferences**  menu and navigate to the  **Graphics**  tab. You will see a new section titled  **Cinematic Camera Settings**.

-   **Enable Smooth Camera:**  Toggle the entire effect on or off.
    
-   **Master Smoothness:**  Drag to the right for a "heavier" cinematic feel, or to the left for more responsive, snappy movement.
    
-   **Advanced Tweaks:**  Expand this menu to override specific smoothing factors or toggle Dynamic Zoom.
    

>*TIP!*
>
> **Lower values**  in the manual "Advanced Tweaks" sliders result in  **smoother**  motion, while  **higher values** make the camera more responsive.

<img width="1512" height="945" alt="image" src="https://github.com/user-attachments/assets/9a8e4082-050a-451b-b5f9-a348954ee09e" />


----------

## Credits

Developed by  [**L Movies**](https://www.youtube.com/@lmoovees),  **ChatGPT**, and  **Gemini**.
