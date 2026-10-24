import ctypes
from ctypes import wintypes

user32 = ctypes.windll.user32
dwmapi = ctypes.windll.dwmapi

hdesk = user32.OpenInputDesktop(0, False, 0x01FF)
if hdesk:
    user32.SetThreadDesktop(hdesk)

hwnd = 4590876
DWMWA_SYSTEMBACKDROP_TYPE = 38
DWMSBT_NONE = 1

val = wintypes.DWORD(DWMSBT_NONE)
hr = dwmapi.DwmSetWindowAttribute(
    hwnd,
    DWMWA_SYSTEMBACKDROP_TYPE,
    ctypes.byref(val),
    ctypes.sizeof(val)
)
print('DwmSetWindowAttribute DWMSBT_NONE res:', hr)

# Disable blur behind
class DWM_BLURBEHIND(ctypes.Structure):
    _fields_ = [
        ('dwFlags', wintypes.DWORD),
        ('fEnable', wintypes.BOOL),
        ('hRgnBlur', wintypes.HRGN),
        ('fTransitionOnMaximized', wintypes.BOOL)
    ]

bb = DWM_BLURBEHIND()
bb.dwFlags = 1 # DWM_BB_ENABLE
bb.fEnable = False
bb.hRgnBlur = 0
bb.fTransitionOnMaximized = False
hr_bb = dwmapi.DwmEnableBlurBehindWindow(hwnd, ctypes.byref(bb))
print('DwmEnableBlurBehindWindow res:', hr_bb)
