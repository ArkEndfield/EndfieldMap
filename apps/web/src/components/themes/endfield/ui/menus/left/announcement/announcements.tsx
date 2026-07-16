import './announcement-content.css';

import type { Announcement, CategoriedAnnouncementBreif } from '@endfieldmap/map-service/@types/announcement';
import { cn } from '@endfieldmap/tools';
import { ArrowLeftIcon,Logo, LogoLoading, ScrollArea, useIsMobile } from '@endfieldmap/web-components';
import { AnnouncementItem } from '@themes/endfield/ui/menus/left/announcement/announcement_item';
import { Markdown } from '@tiptap/markdown';
import { EditorContent,useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { motion } from 'motion/react';
import { useState } from 'react';

import { ScrollableList } from '@/components/common/scrollable_list';

export interface AnnouncementsProps {
  hidden?: boolean;
  list?: CategoriedAnnouncementBreif[keyof CategoriedAnnouncementBreif];
  listLoading: boolean;
  listError: Error | null;

  detail?: Announcement;
  detailLoading: boolean;
  detailError: Error | null;
  loadDetail: (id: number) => void;
}

const ErrorMessage = ({ error }: { error: Error }) => {
  return (
    <div className="text-red-500 flex flex-col justify-center">
      <Logo />
      <div className="text-center">{error.message}</div>
    </div>
  );
};

const CenterContainer = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex items-center justify-center h-full">{children}</div>;
};

const ContentContainer = ({ content }: { content: string }) => {
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content,
    contentType: 'markdown',
    editable: false,
  });
  return (
    <div
      className={cn(
        'flex-1 h-full overflow-hidden pl-6 pr-1',
        'bg-[linear-gradient(180deg,rgba(211,213,223,.79)_0,hsla(0,0%,80%,.79)_30%,hsla(0,0%,80%,.79)_100%)]',
        'shadow-[0_0.28125rem_0.28125rem_0_rgba(0,0,0,.4)]'
      )}
    >
      <ScrollArea scrollBarPlacementStyle="block" contentClassName="pr-2 py-3">
        <EditorContent editor={editor} className="announcement-content" />
      </ScrollArea>
    </div>
  );
};

export const Announcements = ({
  hidden,
  list,
  listLoading,
  listError,
  detail,
  detailLoading,
  detailError,
  loadDetail,
}: AnnouncementsProps) => {
  const isMobile = useIsMobile();
  const [showListOnMobile, setShowListOnMobile] = useState(true);
  return (
    <motion.div
      className={cn(
        'absolute inset-0 flex flex-col md:flex-row p-4 pt-6',
        hidden && 'pointer-events-none'
      )}
      initial={false}
      animate={{ opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={cn(
          'shrink-0 md:w-56 w-full h-full overflow-hidden',
          showListOnMobile ? 'block' : 'hidden',
          'md:block'
        )}
      >
        {listLoading ? (
          <CenterContainer>
            <LogoLoading className="mr-2" />
          </CenterContainer>
        ) : listError ? (
          <CenterContainer>
            <ErrorMessage error={listError} />
          </CenterContainer>
        ) : (
          <ScrollableList className={cn('h-full space-y-5', isMobile && 'ml-8')}>
            {list?.list.map((item) => (
              <AnnouncementItem
                key={item.id}
                item={item}
                active={((detail?.id === item.id) && !isMobile)}
                isRead={item.read}
                onClick={() => {
                  loadDetail(item.id);
                  setShowListOnMobile(false);
                }}
              />
            ))}
          </ScrollableList>
        )}
      </div>

      <div
        className={cn(
          'flex-1 md:h-full h-1/2 overflow-hidden pb-6',
          !isMobile && '-ml-7 pr-2',
          showListOnMobile ? 'hidden' : 'block',
          'md:block'
        )}
      >
        {detailLoading ? (
          <CenterContainer>
            <LogoLoading />
          </CenterContainer>
        ) : detailError ? (
          <CenterContainer>
            <ErrorMessage error={detailError} />
          </CenterContainer>
        ) : !detail ? (
          <CenterContainer>
            <Logo />
          </CenterContainer>
        ) : (
          <div className="h-full flex flex-col">
            <div className="md:hidden mb-2">
              <button
                className="inline-flex items-center px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => setShowListOnMobile(true)}
              >
                <ArrowLeftIcon className="mr-2" />
                Back
              </button>
            </div>
            <ContentContainer content={detail?.content ?? ''} />
          </div>
        )}
      </div>
    </motion.div>
  );
};
