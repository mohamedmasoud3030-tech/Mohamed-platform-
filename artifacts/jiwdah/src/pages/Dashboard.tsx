import { useState, type FormEvent } from "react";
import {
  FileText,
  FolderKanban,
  Inbox,
  LogOut,
  Pencil,
  Plus,
  Save,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import SeoHead from "@/components/SeoHead";
import { pageSeo } from "@/content/seo";
import { useAuth } from "@/hooks/useAuth";
import { useSiteCopy } from "@/hooks/useSiteCopy";
import { usePreferences } from "@/providers/preferences";
import { trpc } from "@/providers/trpc";
import "./dashboard.css";

type DashboardTab = "inquiries" | "projects" | "content";
type ProjectStatus = "draft" | "published" | "archived";
type ContentStatus = "draft" | "published" | "archived";
type InquiryStatus = "new" | "in_progress" | "qualified" | "closed" | "archived";

type ProjectForm = {
  title: string;
  slug: string;
  summary: string;
  description: string;
  imageUrl: string;
  projectUrl: string;
  repositoryUrl: string;
  status: ProjectStatus;
  sortOrder: number;
};

type ContentForm = {
  key: string;
  title: string;
  body: string;
  status: ContentStatus;
};

const EMPTY_PROJECT: ProjectForm = {
  title: "",
  slug: "",
  summary: "",
  description: "",
  imageUrl: "",
  projectUrl: "",
  repositoryUrl: "",
  status: "draft",
  sortOrder: 0,
};

const EMPTY_CONTENT: ContentForm = {
  key: "",
  title: "",
  body: "",
  status: "draft",
};

const TEXT = {
  ar: {
    signedIn: "تم تسجيل الدخول كمسؤول",
    logout: "تسجيل الخروج",
    overview: "نظرة عامة",
    loading: "جارٍ تحميل البيانات...",
    failed: "تعذر تحميل البيانات. تأكد من تطبيق migration الجديدة واتصال قاعدة البيانات.",
    empty: "لا توجد بيانات حتى الآن.",
    add: "إضافة",
    save: "حفظ التعديلات",
    cancel: "إلغاء",
    edit: "تعديل",
    remove: "حذف",
    confirmDelete: "هل تريد حذف هذا العنصر نهائيًا؟",
    name: "الاسم",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    service: "الخدمة",
    message: "الرسالة",
    source: "المصدر",
    status: "الحالة",
    createdAt: "تاريخ الإرسال",
    title: "العنوان",
    slug: "المعرّف المختصر",
    summary: "الملخص",
    description: "الوصف",
    imageUrl: "رابط الصورة",
    projectUrl: "رابط المشروع",
    repositoryUrl: "رابط المستودع",
    sortOrder: "الترتيب",
    key: "مفتاح المحتوى",
    body: "النص",
    projectForm: "إضافة أو تعديل مشروع",
    contentForm: "إضافة أو تعديل محتوى",
    inquiriesHint: "راجع الاستفسارات الجديدة وحدّث حالتها بعد التواصل.",
    projectsHint: "لا يظهر للزوار إلا المشروع المنشور.",
    contentHint: "لا يظهر للزوار إلا المحتوى المنشور.",
    statuses: {
      new: "جديد",
      in_progress: "قيد المتابعة",
      qualified: "مؤهل",
      closed: "مغلق",
      archived: "مؤرشف",
      draft: "مسودة",
      published: "منشور",
    },
  },
  en: {
    signedIn: "Signed in as administrator",
    logout: "Sign out",
    overview: "Overview",
    loading: "Loading data...",
    failed: "Unable to load data. Confirm that the new migration has been applied and the database is reachable.",
    empty: "No data yet.",
    add: "Add",
    save: "Save changes",
    cancel: "Cancel",
    edit: "Edit",
    remove: "Delete",
    confirmDelete: "Delete this item permanently?",
    name: "Name",
    phone: "Phone",
    email: "Email",
    service: "Service",
    message: "Message",
    source: "Source",
    status: "Status",
    createdAt: "Submitted at",
    title: "Title",
    slug: "Slug",
    summary: "Summary",
    description: "Description",
    imageUrl: "Image URL",
    projectUrl: "Project URL",
    repositoryUrl: "Repository URL",
    sortOrder: "Sort order",
    key: "Content key",
    body: "Body",
    projectForm: "Add or edit project",
    contentForm: "Add or edit content",
    inquiriesHint: "Review new inquiries and update their status after follow-up.",
    projectsHint: "Only published projects are visible to visitors.",
    contentHint: "Only published content is visible to visitors.",
    statuses: {
      new: "New",
      in_progress: "In progress",
      qualified: "Qualified",
      closed: "Closed",
      archived: "Archived",
      draft: "Draft",
      published: "Published",
    },
  },
} as const;

function formatDate(value: Date | string, locale: "ar" | "en") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function Dashboard() {
  const copy = useSiteCopy();
  const { locale } = usePreferences();
  const text = TEXT[locale];
  const { user, isAdmin, isLoading, logout } = useAuth({ redirectOnUnauthenticated: true });
  const [activeTab, setActiveTab] = useState<DashboardTab>("inquiries");
  const [projectForm, setProjectForm] = useState<ProjectForm>(EMPTY_PROJECT);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [contentForm, setContentForm] = useState<ContentForm>(EMPTY_CONTENT);
  const [editingContentId, setEditingContentId] = useState<number | null>(null);
  const utils = trpc.useUtils();
  const seo = pageSeo("dashboard", locale);

  const inquiriesQuery = trpc.inquiries.list.useQuery(undefined, { enabled: isAdmin });
  const projectsQuery = trpc.projects.list.useQuery(undefined, { enabled: isAdmin });
  const contentQuery = trpc.content.list.useQuery(undefined, { enabled: isAdmin });

  const updateInquiryStatus = trpc.inquiries.updateStatus.useMutation({
    onSuccess: () => utils.inquiries.list.invalidate(),
  });
  const deleteInquiry = trpc.inquiries.delete.useMutation({
    onSuccess: () => utils.inquiries.list.invalidate(),
  });
  const createProject = trpc.projects.create.useMutation({
    onSuccess: async () => {
      await utils.projects.invalidate();
      resetProjectForm();
    },
  });
  const updateProject = trpc.projects.update.useMutation({
    onSuccess: async () => {
      await utils.projects.invalidate();
      resetProjectForm();
    },
  });
  const deleteProject = trpc.projects.delete.useMutation({
    onSuccess: () => utils.projects.invalidate(),
  });
  const createContent = trpc.content.create.useMutation({
    onSuccess: async () => {
      await utils.content.invalidate();
      resetContentForm();
    },
  });
  const updateContent = trpc.content.update.useMutation({
    onSuccess: async () => {
      await utils.content.invalidate();
      resetContentForm();
    },
  });
  const deleteContent = trpc.content.delete.useMutation({
    onSuccess: () => utils.content.invalidate(),
  });

  function resetProjectForm() {
    setEditingProjectId(null);
    setProjectForm(EMPTY_PROJECT);
  }

  function resetContentForm() {
    setEditingContentId(null);
    setContentForm(EMPTY_CONTENT);
  }

  function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      ...projectForm,
      summary: projectForm.summary || undefined,
      description: projectForm.description || undefined,
      imageUrl: projectForm.imageUrl || undefined,
      projectUrl: projectForm.projectUrl || undefined,
      repositoryUrl: projectForm.repositoryUrl || undefined,
    };
    if (editingProjectId) updateProject.mutate({ id: editingProjectId, ...payload });
    else createProject.mutate(payload);
  }

  function submitContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingContentId) updateContent.mutate({ id: editingContentId, ...contentForm });
    else createContent.mutate(contentForm);
  }

  const seoHead = <SeoHead title={seo.title} description={seo.description} path="/dashboard" noindex />;

  if (isLoading) {
    return (
      <AppShell>
        {seoHead}
        <section className="site-section">
          <div className="site-container empty-state" aria-live="polite">{text.loading}</div>
        </section>
      </AppShell>
    );
  }

  if (!user || !isAdmin) {
    return (
      <AppShell>
        {seoHead}
        <section className="site-section">
          <div className="site-container empty-state" role="alert">
            <ShieldAlert size={24} style={{ margin: "0 auto 12px" }} />
            {copy.dashboard.empty}
          </div>
        </section>
      </AppShell>
    );
  }

  const tabs: Array<{ id: DashboardTab; label: string; icon: typeof Inbox; count: number }> = [
    { id: "inquiries", label: copy.dashboard.inquiries, icon: Inbox, count: inquiriesQuery.data?.length ?? 0 },
    { id: "projects", label: copy.dashboard.portfolio, icon: FolderKanban, count: projectsQuery.data?.length ?? 0 },
    { id: "content", label: copy.dashboard.content, icon: FileText, count: contentQuery.data?.length ?? 0 },
  ];

  return (
    <AppShell>
      {seoHead}
      <section className="site-section dashboard-shell">
        <div className="site-container">
          <div className="dashboard-header bento-card bento-full">
            <div>
              <p className="section-kicker">{copy.dashboard.title}</p>
              <h1 className="section-title-small">{copy.dashboard.subtitle}</h1>
              <p className="service-description">{text.signedIn}: {user.name || user.email}</p>
            </div>
            <button type="button" className="btn-secondary" onClick={logout}>
              <LogOut size={17} /> {text.logout}
            </button>
          </div>

          <div className="dashboard-summary" aria-label={text.overview}>
            {tabs.map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                type="button"
                className={`dashboard-summary-card ${activeTab === id ? "dashboard-summary-card-active" : ""}`}
                onClick={() => setActiveTab(id)}
              >
                <span className="service-icon"><Icon size={20} /></span>
                <span>{label}</span>
                <strong>{count}</strong>
              </button>
            ))}
          </div>

          {activeTab === "inquiries" && (
            <section className="dashboard-panel" aria-labelledby="dashboard-inquiries-title">
              <div className="dashboard-panel-heading">
                <div>
                  <h2 id="dashboard-inquiries-title">{copy.dashboard.inquiries}</h2>
                  <p>{text.inquiriesHint}</p>
                </div>
              </div>
              {inquiriesQuery.isLoading ? (
                <div className="empty-state">{text.loading}</div>
              ) : inquiriesQuery.error ? (
                <div className="empty-state" role="alert">{text.failed}</div>
              ) : inquiriesQuery.data?.length ? (
                <div className="dashboard-list">
                  {inquiriesQuery.data.map((inquiry) => (
                    <article key={inquiry.id} className="dashboard-record">
                      <div className="dashboard-record-main">
                        <div className="dashboard-record-title-row">
                          <h3>{inquiry.name}</h3>
                          <time>{formatDate(inquiry.createdAt, locale)}</time>
                        </div>
                        <dl className="dashboard-meta-grid">
                          {inquiry.phone && <div><dt>{text.phone}</dt><dd dir="ltr">{inquiry.phone}</dd></div>}
                          {inquiry.email && <div><dt>{text.email}</dt><dd>{inquiry.email}</dd></div>}
                          {inquiry.service && <div><dt>{text.service}</dt><dd>{inquiry.service}</dd></div>}
                          <div><dt>{text.source}</dt><dd>{inquiry.source}</dd></div>
                        </dl>
                        <p className="dashboard-message">{inquiry.message}</p>
                      </div>
                      <div className="dashboard-record-actions">
                        <label>
                          <span>{text.status}</span>
                          <select
                            value={inquiry.status}
                            onChange={(event) => updateInquiryStatus.mutate({ id: inquiry.id, status: event.target.value as InquiryStatus })}
                          >
                            {(["new", "in_progress", "qualified", "closed", "archived"] as InquiryStatus[]).map((status) => (
                              <option key={status} value={status}>{text.statuses[status]}</option>
                            ))}
                          </select>
                        </label>
                        <button
                          type="button"
                          className="dashboard-danger-button"
                          onClick={() => window.confirm(text.confirmDelete) && deleteInquiry.mutate({ id: inquiry.id })}
                          aria-label={text.remove}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">{text.empty}</div>
              )}
            </section>
          )}

          {activeTab === "projects" && (
            <section className="dashboard-panel" aria-labelledby="dashboard-projects-title">
              <div className="dashboard-panel-heading">
                <div>
                  <h2 id="dashboard-projects-title">{copy.dashboard.portfolio}</h2>
                  <p>{text.projectsHint}</p>
                </div>
              </div>
              <form className="dashboard-form" onSubmit={submitProject}>
                <h3>{text.projectForm}</h3>
                <div className="dashboard-form-grid">
                  <label><span>{text.title}</span><input required value={projectForm.title} onChange={(event) => setProjectForm({ ...projectForm, title: event.target.value })} /></label>
                  <label><span>{text.slug}</span><input required dir="ltr" value={projectForm.slug} onChange={(event) => setProjectForm({ ...projectForm, slug: event.target.value })} /></label>
                  <label className="dashboard-form-wide"><span>{text.summary}</span><textarea value={projectForm.summary} onChange={(event) => setProjectForm({ ...projectForm, summary: event.target.value })} /></label>
                  <label className="dashboard-form-wide"><span>{text.description}</span><textarea value={projectForm.description} onChange={(event) => setProjectForm({ ...projectForm, description: event.target.value })} /></label>
                  <label><span>{text.imageUrl}</span><input type="url" dir="ltr" value={projectForm.imageUrl} onChange={(event) => setProjectForm({ ...projectForm, imageUrl: event.target.value })} /></label>
                  <label><span>{text.projectUrl}</span><input type="url" dir="ltr" value={projectForm.projectUrl} onChange={(event) => setProjectForm({ ...projectForm, projectUrl: event.target.value })} /></label>
                  <label><span>{text.repositoryUrl}</span><input type="url" dir="ltr" value={projectForm.repositoryUrl} onChange={(event) => setProjectForm({ ...projectForm, repositoryUrl: event.target.value })} /></label>
                  <label><span>{text.sortOrder}</span><input type="number" min="0" value={projectForm.sortOrder} onChange={(event) => setProjectForm({ ...projectForm, sortOrder: Number(event.target.value) })} /></label>
                  <label><span>{text.status}</span><select value={projectForm.status} onChange={(event) => setProjectForm({ ...projectForm, status: event.target.value as ProjectStatus })}><option value="draft">{text.statuses.draft}</option><option value="published">{text.statuses.published}</option><option value="archived">{text.statuses.archived}</option></select></label>
                </div>
                <div className="actions-row">
                  <button type="submit" className="btn-primary" disabled={createProject.isPending || updateProject.isPending}>{editingProjectId ? <Save size={17} /> : <Plus size={17} />}{editingProjectId ? text.save : text.add}</button>
                  {editingProjectId && <button type="button" className="btn-secondary" onClick={resetProjectForm}><X size={17} />{text.cancel}</button>}
                </div>
              </form>
              {projectsQuery.isLoading ? <div className="empty-state">{text.loading}</div> : projectsQuery.error ? <div className="empty-state" role="alert">{text.failed}</div> : projectsQuery.data?.length ? (
                <div className="dashboard-list">
                  {projectsQuery.data.map((project) => (
                    <article key={project.id} className="dashboard-record">
                      <div className="dashboard-record-main"><div className="dashboard-record-title-row"><h3>{project.title}</h3><span className="dashboard-status">{text.statuses[project.status]}</span></div><p className="dashboard-message">{project.summary || project.description || project.slug}</p></div>
                      <div className="dashboard-record-actions dashboard-action-buttons">
                        <button type="button" className="icon-button" aria-label={text.edit} onClick={() => { setEditingProjectId(project.id); setProjectForm({ title: project.title, slug: project.slug, summary: project.summary ?? "", description: project.description ?? "", imageUrl: project.imageUrl ?? "", projectUrl: project.projectUrl ?? "", repositoryUrl: project.repositoryUrl ?? "", status: project.status, sortOrder: project.sortOrder }); }}><Pencil size={16} /></button>
                        <button type="button" className="dashboard-danger-button" aria-label={text.remove} onClick={() => window.confirm(text.confirmDelete) && deleteProject.mutate({ id: project.id })}><Trash2 size={16} /></button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : <div className="empty-state">{text.empty}</div>}
            </section>
          )}

          {activeTab === "content" && (
            <section className="dashboard-panel" aria-labelledby="dashboard-content-title">
              <div className="dashboard-panel-heading"><div><h2 id="dashboard-content-title">{copy.dashboard.content}</h2><p>{text.contentHint}</p></div></div>
              <form className="dashboard-form" onSubmit={submitContent}>
                <h3>{text.contentForm}</h3>
                <div className="dashboard-form-grid">
                  <label><span>{text.key}</span><input required dir="ltr" value={contentForm.key} onChange={(event) => setContentForm({ ...contentForm, key: event.target.value })} /></label>
                  <label><span>{text.title}</span><input required value={contentForm.title} onChange={(event) => setContentForm({ ...contentForm, title: event.target.value })} /></label>
                  <label><span>{text.status}</span><select value={contentForm.status} onChange={(event) => setContentForm({ ...contentForm, status: event.target.value as ContentStatus })}><option value="draft">{text.statuses.draft}</option><option value="published">{text.statuses.published}</option><option value="archived">{text.statuses.archived}</option></select></label>
                  <label className="dashboard-form-wide"><span>{text.body}</span><textarea required rows={7} value={contentForm.body} onChange={(event) => setContentForm({ ...contentForm, body: event.target.value })} /></label>
                </div>
                <div className="actions-row">
                  <button type="submit" className="btn-primary" disabled={createContent.isPending || updateContent.isPending}>{editingContentId ? <Save size={17} /> : <Plus size={17} />}{editingContentId ? text.save : text.add}</button>
                  {editingContentId && <button type="button" className="btn-secondary" onClick={resetContentForm}><X size={17} />{text.cancel}</button>}
                </div>
              </form>
              {contentQuery.isLoading ? <div className="empty-state">{text.loading}</div> : contentQuery.error ? <div className="empty-state" role="alert">{text.failed}</div> : contentQuery.data?.length ? (
                <div className="dashboard-list">
                  {contentQuery.data.map((entry) => (
                    <article key={entry.id} className="dashboard-record">
                      <div className="dashboard-record-main"><div className="dashboard-record-title-row"><h3>{entry.title}</h3><span className="dashboard-status">{text.statuses[entry.status]}</span></div><code>{entry.key}</code><p className="dashboard-message">{entry.body}</p></div>
                      <div className="dashboard-record-actions dashboard-action-buttons">
                        <button type="button" className="icon-button" aria-label={text.edit} onClick={() => { setEditingContentId(entry.id); setContentForm({ key: entry.key, title: entry.title, body: entry.body, status: entry.status }); }}><Pencil size={16} /></button>
                        <button type="button" className="dashboard-danger-button" aria-label={text.remove} onClick={() => window.confirm(text.confirmDelete) && deleteContent.mutate({ id: entry.id })}><Trash2 size={16} /></button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : <div className="empty-state">{text.empty}</div>}
            </section>
          )}
        </div>
      </section>
    </AppShell>
  );
}
