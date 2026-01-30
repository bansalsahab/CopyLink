from PIL import Image, ImageDraw

# Define colors matching the extension theme
PRIMARY_COLOR = (102, 126, 234)  # #667eea
SECONDARY_COLOR = (118, 75, 162)  # #764ba2
WHITE = (255, 255, 255)

def create_icon(size, filename):
    """Create an icon of specified size with gradient-like effect"""
    # Create image with primary color
    img = Image.new('RGB', (size, size), color=PRIMARY_COLOR)
    draw = ImageDraw.Draw(img)
    
    # Draw a border rectangle
    border_width = max(2, size // 32)
    margin = size // 8
    draw.rectangle(
        [margin, margin, size - margin, size - margin],
        outline=WHITE,
        width=border_width
    )
    
    # Draw a chain link symbol (or L for Link)
    # Simple design: two connected circles representing a chain link
    circle_margin = size // 4
    radius = size // 6
    
    # Left circle
    draw.ellipse(
        [circle_margin, circle_margin, circle_margin + radius * 2, circle_margin + radius * 2],
        outline=WHITE,
        width=border_width
    )
    
    # Right circle
    draw.ellipse(
        [size - circle_margin - radius * 2, circle_margin, size - circle_margin, circle_margin + radius * 2],
        outline=WHITE,
        width=border_width
    )
    
    # Connecting line
    line_y = size // 2
    draw.line(
        [(circle_margin + radius, line_y), (size - circle_margin - radius, line_y)],
        fill=WHITE,
        width=border_width
    )
    
    img.save(filename)
    print(f"Created {filename}")

# Create icons in all sizes
sizes = [
    (16, r"c:\Users\Parth bansal\Desktop\copypasteexxtension\extension\icons\icon-16.png"),
    (48, r"c:\Users\Parth bansal\Desktop\copypasteexxtension\extension\icons\icon-48.png"),
    (128, r"c:\Users\Parth bansal\Desktop\copypasteexxtension\extension\icons\icon-128.png")
]

for size, filepath in sizes:
    create_icon(size, filepath)

print("\n✅ All icons created successfully!")
