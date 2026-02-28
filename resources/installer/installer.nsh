; ────────────────────────────────────────────────────────────────────
; Your Friendly Terminal — Custom NSIS installer include
; Matches website brand: golden theme, friendly tone
; ────────────────────────────────────────────────────────────────────

; ── Welcome page ───────────────────────────────────────────────────
!define MUI_WELCOMEPAGE_TITLE "Welcome to Your Friendly Terminal"
!define MUI_WELCOMEPAGE_TEXT "This wizard will guide you through the installation of Your Friendly Terminal.$\r$\n$\r$\nAI-powered development for everyone — build anything with Claude Code, Gemini CLI, and OpenAI Codex. No coding experience needed.$\r$\n$\r$\nClick Next to continue."

; ── Finish page ────────────────────────────────────────────────────
!define MUI_FINISHPAGE_TITLE "You're All Set!"
!define MUI_FINISHPAGE_TEXT "Your Friendly Terminal has been installed on your computer.$\r$\n$\r$\nStart building with AI — just describe what you want in plain English.$\r$\n$\r$\nClick Finish to close this wizard."
!define MUI_FINISHPAGE_RUN_TEXT "Launch Your Friendly Terminal"

; ── Uninstaller welcome ───────────────────────────────────────────
!define MUI_UNWELCOMEPAGE_TITLE "Uninstall Your Friendly Terminal"
!define MUI_UNWELCOMEPAGE_TEXT "This wizard will remove Your Friendly Terminal from your computer.$\r$\n$\r$\nYour projects and files will not be affected.$\r$\n$\r$\nClick Next to continue."

; ── Uninstaller finish ────────────────────────────────────────────
!define MUI_UNCONFIRMPAGE_TEXT_TOP "Your Friendly Terminal will be uninstalled from the following folder."
!define MUI_FINISHPAGE_NOAUTOCLOSE
!define MUI_UNFINISHPAGE_NOAUTOCLOSE
