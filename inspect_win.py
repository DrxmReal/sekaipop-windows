import ctypes
from ctypes import wintypes
import sys

user32 = ctypes.windll.user32

GWL_STYLE = -16
GWL_EXSTYLE = -20

pid_target = int(sys.argv[1]) if len(sys.argv) > 1 else 22700

hdesk = user32.OpenInputDesktop(0, False, 0x01FF)
if hdesk:
    user32.SetThreadDesktop(hdesk)

def enum_cb(hwnd, extra):
    pid = wintypes.DWORD()
    user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
    if pid.value == pid_target:
        length = user32.GetWindowTextLengthW(hwnd)
        buf = ctypes.create_unicode_buffer(length + 1)
        user32.GetWindowTextW(hwnd, buf, length + 1)
        cls_buf = ctypes.create_unicode_buffer(256)
        user32.GetClassNameW(hwnd, cls_buf, 256)
        style = user32.GetWindowLongW(hwnd, GWL_STYLE)
        exstyle = user32.GetWindowLongW(hwnd, GWL_EXSTYLE)
        rect = wintypes.RECT()
        user32.GetWindowRect(hwnd, ctypes.byref(rect))
        print(f'HWND: {hwnd}, Vis: {user32.IsWindowVisible(hwnd)}, Title: "{buf.value}", Class: "{cls_buf.value}", Rect: ({rect.left},{rect.top},{rect.right},{rect.bottom}), Style: {style:#010x}, ExStyle: {exstyle:#010x}')
    return True

WNDENUMPROC = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)
if hdesk:
    user32.EnumDesktopWindows(hdesk, WNDENUMPROC(enum_cb), 0)
else:
    user32.EnumWindows(WNDENUMPROC(enum_cb), 0)
