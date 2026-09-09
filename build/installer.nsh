; Koven 安装器定制（electron-builder nsis.include，须 UTF-8 BOM）
; 1. 默认安装目录：D:\Program Files\Koven（无 D 盘回退系统 Program Files；覆盖安装沿用已有目录）
; 2. 卸载数据保护：交互卸载询问备份到 我的文档\Koven-数据备份；静默卸载（覆盖升级）保留 .data

!macro customInit
  ReadRegStr $0 HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation
  ${If} $0 != ""
    StrCpy $INSTDIR $0
  ${Else}
    ; 坑：FileExists 对盘符根 "D:\" 恒返回假，须用 "D:\*.*"
    ${If} ${FileExists} "D:\*.*"
      StrCpy $INSTDIR "D:\Program Files\${APP_FILENAME}"
    ${Else}
      StrCpy $INSTDIR "$PROGRAMFILES64\${APP_FILENAME}"
    ${EndIf}
  ${EndIf}
!macroend

!macro customInstall
  ExecWait 'icacls "$INSTDIR" /grant "*S-1-5-32-545:(OI)(CI)M" /Q'
!macroend

!macro customUnInstall
  ${IfNot} ${Silent}
    ${If} ${FileExists} "$INSTDIR\.data"
      MessageBox MB_YESNO|MB_ICONQUESTION|MB_DEFBUTTON1 \
        "检测到应用数据。$\r$\n$\r$\n选择【是】：备份到 我的文档\Koven-数据备份 后再卸载；$\r$\n选择【否】：直接删除全部数据。" \
        IDYES doBackup
      Goto doDelete
    doBackup:
      CreateDirectory "$DOCUMENTS\Koven-数据备份"
      ClearErrors
      CopyFiles /SILENT "$INSTDIR\.data\*.*" "$DOCUMENTS\Koven-数据备份\"
      ${If} ${Errors}
        MessageBox MB_OK|MB_ICONEXCLAMATION "备份失败，数据将被删除，请手动复制 $INSTDIR\.data 目录后重试。"
      ${EndIf}
    doDelete:
    ${EndIf}
  ${EndIf}
!macroend

!macro customRemoveFiles
  ${If} ${Silent}
    ${If} ${FileExists} "$INSTDIR\.data"
      ClearErrors
      Rename "$INSTDIR\.data" "$INSTDIR\..\Koven-data-tmp"
      ${If} ${Errors}
        RMDir /r "$INSTDIR\..\Koven-data-tmp"
        Abort "应用数据目录被占用，无法安全卸载/升级，请关闭程序后重试。"
      ${EndIf}
      RMDir /r $INSTDIR
      CreateDirectory "$INSTDIR"
      Rename "$INSTDIR\..\Koven-data-tmp" "$INSTDIR\.data"
    ${Else}
      RMDir /r $INSTDIR
    ${EndIf}
  ${Else}
    RMDir /r $INSTDIR
  ${EndIf}
!macroend
