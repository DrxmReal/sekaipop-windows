#include <windows.h>
#include <stdio.h>
#include <vector>

#define EVERYTHING_IPC_COPYDATA_QUERYW 2

typedef struct {
    DWORD max_results;
    DWORD offset;
    DWORD reply_copydata_message;
    DWORD search_flags;
    DWORD reply_hwnd;
    WCHAR search_string[1];
} EVERYTHING_IPC_QUERYW;

typedef struct {
    DWORD totitems;
    DWORD numitems;
    DWORD offset;
} EVERYTHING_IPC_LISTW;

typedef struct {
    DWORD flags;
    DWORD filename_offset;
    DWORD path_offset;
} EVERYTHING_IPC_ITEMW;

static bool g_received = false;

LRESULT CALLBACK TestWndProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
    if (uMsg == WM_COPYDATA) {
        COPYDATASTRUCT* cds = (COPYDATASTRUCT*)lParam;
        if (cds && cds->dwData == 1001 && cds->cbData >= sizeof(EVERYTHING_IPC_LISTW)) {
            EVERYTHING_IPC_LISTW* list = (EVERYTHING_IPC_LISTW*)cds->lpData;
            printf("Received Everything reply! Tot: %lu, Num: %lu\n", list->totitems, list->numitems);
            EVERYTHING_IPC_ITEMW* items = (EVERYTHING_IPC_ITEMW*)((BYTE*)list + sizeof(EVERYTHING_IPC_LISTW));
            for (DWORD i = 0; i < list->numitems && i < 5; i++) {
                const wchar_t* fn = (const wchar_t*)((BYTE*)list + items[i].filename_offset);
                const wchar_t* p = (const wchar_t*)((BYTE*)list + items[i].path_offset);
                wprintf(L"  [%lu] %ls \\ %ls\n", i, p, fn);
            }
            g_received = true;
            return 1;
        }
    }
    return DefWindowProcW(hwnd, uMsg, wParam, lParam);
}

int main() {
    HDESK hDesk = OpenInputDesktop(0, FALSE, 0x01FF);
    if (hDesk) SetThreadDesktop(hDesk);

    WNDCLASSEXW wc = { sizeof(wc) };
    wc.lpfnWndProc = TestWndProc;
    wc.hInstance = GetModuleHandleW(NULL);
    wc.lpszClassName = L"TestEverythingIPCClass";
    RegisterClassExW(&wc);

    HWND hWnd = CreateWindowExW(0, wc.lpszClassName, L"TestWin", 0, 0, 0, 0, 0, NULL, NULL, wc.hInstance, NULL);
    if (!hWnd) { printf("CreateWindow failed\n"); return 1; }

    HWND hEverything = FindWindowW(L"EVERYTHING_TASKBAR_NOTIFICATION", NULL);
    if (!hEverything) { printf("Everything not running\n"); return 1; }

    const wchar_t* search = L"wezterm";
    DWORD searchLen = (DWORD)wcslen(search);
    DWORD querySize = sizeof(EVERYTHING_IPC_QUERYW) + searchLen * sizeof(WCHAR);

    std::vector<BYTE> buf(querySize);
    EVERYTHING_IPC_QUERYW* query = (EVERYTHING_IPC_QUERYW*)buf.data();
    query->max_results = 10;
    query->offset = 0;
    query->reply_copydata_message = 1001;
    query->search_flags = 0;
    query->reply_hwnd = (DWORD)(DWORD_PTR)hWnd;
    wcscpy(query->search_string, search);

    COPYDATASTRUCT cds;
    cds.dwData = EVERYTHING_IPC_COPYDATA_QUERYW;
    cds.cbData = querySize;
    cds.lpData = buf.data();

    SendMessageW(hEverything, WM_COPYDATA, (WPARAM)hWnd, (LPARAM)&cds);

    MSG msg;
    DWORD start = GetTickCount();
    while (GetTickCount() - start < 1500 && !g_received) {
        if (PeekMessageW(&msg, NULL, 0, 0, PM_REMOVE)) {
            TranslateMessage(&msg);
            DispatchMessageW(&msg);
        }
        Sleep(5);
    }

    DestroyWindow(hWnd);
    printf("Test finished. Received: %d\n", g_received);
    return 0;
}
