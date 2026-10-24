import ctypes
from ctypes import wintypes
import sys

user32 = ctypes.windll.user32

hdesk = user32.OpenInputDesktop(0, False, 0x01FF)
user32.SetThreadDesktop(hdesk)

hwnd = 2949410
GWL_STYLE = -16
GWL_EXSTYLE = -20

WS_CAPTION = 0x00C00000
WS_THICKFRAME = 0x00040000
WS_MINIMIZEBOX = 0x00020000
WS_MAXIMIZEBOX = 0x00010000
WS_SYSMENU = 0x00080000
WS_BORDER = 0x00800000
WS_DLGFRAME = 0x00400000
WS_POPUP = 0x80000000

style = user32.GetWindowLongW(hwnd, GWL_STYLE)
print('Before style:', hex(style))

style &= ~(WS_CAPTION | WS_THICKFRAME | WS_MINIMIZEBOX | WS_MAXIMIZEBOX | WS_SYSMENU | WS_BORDER | WS_DLGFRAME)
style |= WS_POPUP
user32.SetWindowLongW(hwnd, GWL_STYLE, style)

SWP_NOMOVE = 0x0002
SWP_NOSIZE = 0x0001
SWP_NOZORDER = 0x0004
SWP_FRAMECHANGED = 0x0020

user32.SetWindowPos(hwnd, 0, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_FRAMECHANGED)

new_style = user32.GetWindowLongW(hwnd, GWL_STYLE)
print('After style:', hex(new_style))
