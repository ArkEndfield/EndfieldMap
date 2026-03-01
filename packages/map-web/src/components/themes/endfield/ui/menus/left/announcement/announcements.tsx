import type { Announcement, CategoriedAnnouncementBreif } from '@endfieldmap/map-service/@types/announcement';
import { motion } from 'motion/react';
import { cn } from '@endfieldmap/tools';
import { Logo, LogoLoading, ScrollArea } from '@endfieldmap/web-components';

import { ScrollableList } from '@/components/common/scrollable_list';
import { AnnouncementItem } from '@themes/endfield/ui/menus/left/announcement/announcement_item';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import './announcement-content.css';

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
  return (
    <motion.div
      className={cn('absolute inset-0 flex p-4 pt-6', hidden && 'pointer-events-none')}
      initial={false}
      animate={{ opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="shrink-0 w-56 h-full overflow-hidden">
        {listLoading ? (
          <CenterContainer>
            <LogoLoading />
          </CenterContainer>
        ) : listError ? (
          <CenterContainer>
            <ErrorMessage error={listError} />
          </CenterContainer>
        ) : (
          <ScrollableList className="h-full space-y-5">
            {list?.list.map((item) => (
              <AnnouncementItem
                key={item.id}
                item={item}
                active={detail?.id === item.id}
                isRead={item.read}
                onClick={() => loadDetail(item.id)}
              />
            ))}
          </ScrollableList>
        )}
      </div>

      <div className="flex-1 h-full overflow-hidden pr-2 pb-6 -ml-6">
        {detailLoading ? (
          <CenterContainer>
            <LogoLoading />
          </CenterContainer>
        ) : detailError ? (
          <CenterContainer>
            <ErrorMessage error={detailError} />
          </CenterContainer>
        ) : (
          <ContentContainer content={detail?.content ?? ''} />
        )}
      </div>
    </motion.div>
  );
};
