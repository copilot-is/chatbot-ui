import { ChatbotUIContext } from "@/context/context"
import { getFileFromStorage } from "@/db/storage/files"
import useHotkey from "@/lib/hooks/use-hotkey"
import { ChatFile, MessageImage } from "@/types"
import {
  IconCircleFilled,
  IconFileFilled,
  IconFileTypePdf,
  IconLoader2,
  IconX
} from "@tabler/icons-react"
import Image from "next/image"
import { FC, useContext, useState } from "react"
import { Button } from "../ui/button"
import { FilePreview } from "../ui/file-preview"
import { WithTooltip } from "../ui/with-tooltip"

interface ChatFilesDisplayProps {}

export const ChatFilesDisplay: FC<ChatFilesDisplayProps> = ({}) => {
  useHotkey("f", () => setShowFilesDisplay(prev => !prev))
  useHotkey("e", () => setUseRetrieval(prev => !prev))

  const {
    files,
    newMessageImages,
    setNewMessageImages,
    newMessageFiles,
    setNewMessageFiles,
    setShowFilesDisplay,
    showFilesDisplay,
    chatFiles,
    chatImages,
    setChatImages,
    setChatFiles,
    setUseRetrieval
  } = useContext(ChatbotUIContext)

  const [selectedFile, setSelectedFile] = useState<ChatFile | null>(null)
  const [selectedImage, setSelectedImage] = useState<MessageImage | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const messageImages = [
    ...newMessageImages.filter(
      image =>
        !chatImages.some(chatImage => chatImage.messageId === image.messageId)
    )
  ]

  const combinedChatFiles = [
    ...newMessageFiles.filter(
      file => !chatFiles.some(chatFile => chatFile.id === file.id)
    ),
    ...chatFiles
  ]

  const combinedMessageFiles = [...messageImages, ...combinedChatFiles]

  const getLinkAndView = async (file: ChatFile) => {
    const fileRecord = files.find(f => f.id === file.id)

    if (!fileRecord) return

    const link = await getFileFromStorage(fileRecord.file_path)
    window.open(link, "_blank")
  }

  return showFilesDisplay && combinedMessageFiles.length > 0 ? (
    <>
      {showPreview && selectedImage && (
        <FilePreview
          type="image"
          item={selectedImage}
          isOpen={showPreview}
          onOpenChange={(isOpen: boolean) => {
            setShowPreview(isOpen)
            setSelectedImage(null)
          }}
        />
      )}

      {showPreview && selectedFile && (
        <FilePreview
          type="file"
          item={selectedFile}
          isOpen={showPreview}
          onOpenChange={(isOpen: boolean) => {
            setShowPreview(isOpen)
            setSelectedFile(null)
          }}
        />
      )}

      <div className="space-y-5">
        <div className="flex w-full justify-center space-x-2">
          <Button
            className="w-[100px]] h-[24px] text-xs"
            onClick={() => setShowFilesDisplay(false)}
          >
            Hide files
          </Button>

          {(chatFiles.length > 0 || newMessageFiles.length > 0) && (
            <RetrievalToggle />
          )}
        </div>

        <div className="overflow-auto">
          <div className="flex flex-wrap gap-6 truncate pt-2">
            {messageImages.map((image, index) => (
              <div
                key={index}
                className="relative flex h-[64px] cursor-pointer items-center space-x-4 rounded-xl hover:opacity-50"
              >
                <Image
                  className="rounded"
                  // Force the image to be 56px by 56px
                  style={{
                    minWidth: "56px",
                    minHeight: "56px",
                    maxHeight: "56px",
                    maxWidth: "56px"
                  }}
                  src={image.base64} // Preview images will always be base64
                  alt="File image"
                  width={56}
                  height={56}
                  onClick={() => {
                    setSelectedImage(image)
                    setShowPreview(true)
                  }}
                />

                <IconX
                  className="bg-muted-foreground border-primary absolute right-[-6px] top-[-2px] flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-[1px] text-[10px] hover:border-red-500 hover:bg-white hover:text-red-500"
                  onClick={e => {
                    e.stopPropagation()
                    setNewMessageImages(
                      newMessageImages.filter(
                        f => f.messageId !== image.messageId
                      )
                    )
                    setChatImages(
                      chatImages.filter(f => f.messageId !== image.messageId)
                    )
                  }}
                />
              </div>
            ))}

            {combinedChatFiles.map((file, index) =>
              file.id === "loading" ? (
                <div
                  key={index}
                  className="relative flex h-[64px] items-center space-x-4 rounded-xl border-2 px-4 py-3"
                >
                  <div className="rounded bg-blue-500 p-2">
                    <IconLoader2 className="animate-spin" />
                  </div>

                  <div className="truncate text-sm">
                    <div className="truncate">{file.name}</div>
                    <div className="truncate opacity-50">{file.type}</div>
                  </div>
                </div>
              ) : (
                <div
                  key={file.id}
                  className="relative flex h-[64px] cursor-pointer items-center space-x-4 rounded-xl border-2 px-4 py-3 hover:opacity-50"
                  onClick={() => getLinkAndView(file)}
                >
                  <div className="rounded bg-blue-500 p-2">
                    {(() => {
                      let fileExtension = file.type.includes("/")
                        ? file.type.split("/")[1]
                        : file.type

                      switch (fileExtension) {
                        case "pdf":
                          return <IconFileTypePdf />
                        default:
                          return <IconFileFilled />
                      }
                    })()}
                  </div>

                  <div className="truncate text-sm">
                    <div className="truncate">{file.name}</div>
                    <div className="truncate opacity-50">
                      {file.type.includes("/")
                        ? file.type.split("/")[1].toUpperCase()
                        : file.type.toUpperCase()}
                    </div>
                  </div>

                  <IconX
                    className="bg-muted-foreground border-primary absolute right-[-6px] top-[-6px] flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border-[1px] text-[10px] hover:border-red-500 hover:bg-white hover:text-red-500"
                    onClick={e => {
                      e.stopPropagation()
                      setNewMessageFiles(
                        newMessageFiles.filter(f => f.id !== file.id)
                      )
                      setChatFiles(chatFiles.filter(f => f.id !== file.id))
                    }}
                  />
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </>
  ) : (
    combinedMessageFiles.length > 0 && (
      <div className="mb-4 flex w-full justify-center space-x-2">
        <Button
          className="h-[24px] text-xs"
          onClick={() => setShowFilesDisplay(true)}
        >
          View {combinedMessageFiles.length} file
          {combinedMessageFiles.length > 1 ? "s" : ""}
        </Button>

        <RetrievalToggle />
      </div>
    )
  )
}

const RetrievalToggle = ({}) => {
  const { useRetrieval, setUseRetrieval } = useContext(ChatbotUIContext)
  return (
    <WithTooltip
      delayDuration={300}
      side="top"
      display={
        <div>
          {useRetrieval
            ? "File retrieval is enabled for the selected files for this message. Click to disable."
            : "Click to enable file retrieval for this message."}
        </div>
      }
      trigger={
        <Button
          className="h-[24px] w-[100px] justify-between text-xs"
          onClick={() => setUseRetrieval(prev => !prev)}
        >
          <IconCircleFilled
            className={useRetrieval ? "text-green-500" : "text-red-500"}
            size={12}
          />

          <div className="ml-1">{useRetrieval ? "Enabled" : "Disabled"}</div>
        </Button>
      }
    />
  )
}
