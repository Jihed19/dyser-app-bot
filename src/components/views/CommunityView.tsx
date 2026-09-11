import React, { useState } from 'react';
import {
  MessageSquareQuote,
  ThumbsUp,
  MessageCircle,
  Share2,
  Search,
  Filter,
  Plus,
  BookOpen,
  FileText,
  HelpCircle,
  Sparkles,
  Send,
  X,
  CheckCircle2,
  Tag,
  Clock,
  User,
} from 'lucide-react';
import { CommunityPost, CommunityComment } from '../../types';
import { STUDENT_AVATAR } from '../../data/mockData';

const INITIAL_POSTS: CommunityPost[] = [
  {
    id: 'post-1',
    title: 'Guía resumida y demostración de Teorema de Nyquist para el examen parcial',
    content:
      'Hola a todos. Para el examen de Procesamiento de Señales preparé este desglose matemático del criterio de Nyquist-Shannon y cómo evitar el aliasing con filtros pasabajos. Incluye 3 ejercicios resueltos con su transformada de Fourier.',
    authorName: 'María Sandoval',
    authorSemester: 'Semestre VI • Ing. Sistemas',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    subject: 'Sistemas & Señales',
    tag: 'apunte',
    likesCount: 24,
    isLiked: false,
    commentsCount: 3,
    hasAttachment: true,
    attachmentName: 'Guia_Nyquist_Shannon_Ejercicios.pdf',
    createdAt: Date.now() - 1000 * 60 * 60 * 4,
    comments: [
      {
        id: 'c-1',
        authorName: 'Carlos Morales',
        authorRole: 'Compañero',
        content: '¡Excelente aporte María! La explicación de la frecuencia de muestreo me salvó para la parte práctica.',
        createdAt: Date.now() - 1000 * 60 * 60 * 3,
        likesCount: 5,
      },
      {
        id: 'c-2',
        authorName: 'Prof. J. Ramírez',
        authorRole: 'Docente Titular',
        content: 'Muy buen rigor analítico en la deducción. Recomiendo prestar especial atención al ejercicio 2 para el parcial.',
        createdAt: Date.now() - 1000 * 60 * 60 * 2,
        likesCount: 12,
      },
    ],
  },
  {
    id: 'post-2',
    title: '¿Cómo memorizan y demuestran las propiedades de las transacciones ACID en Base de Datos?',
    content:
      'Tengo examen de Base de Datos el viernes. La parte de Aislamiento (Isolation) con niveles de bloqueo de dos fases (2PL) y anomalías como lecturas fantasma se me complica. ¿Qué mnemotecnia o técnica de estudio les ha funcionado mejor?',
    authorName: 'David Kim',
    authorSemester: 'Semestre V • Computación',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    subject: 'Bases de Datos',
    tag: 'duda',
    likesCount: 15,
    isLiked: true,
    commentsCount: 2,
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    comments: [
      {
        id: 'c-3',
        authorName: 'Sofía Chen',
        authorRole: 'Estudiante',
        content: 'Dibuja una línea de tiempo con dos transacciones T1 y T2 concurrentes. Cuando ves las operaciones intercaladas es imposible olvidar el dirty read.',
        createdAt: Date.now() - 1000 * 60 * 60 * 10,
        likesCount: 7,
      },
    ],
  },
  {
    id: 'post-3',
    title: 'Recomendaciones de oratoria para la defensa de proyecto de fin de semestre',
    content:
      'Ayer defendimos el proyecto ante el jurado de la facultad y obtuvimos mención. Tres puntos clave que cambiaron todo: 1) Abrir con el problema real del usuario en 45 segundos, 2) No poner más de 6 palabras por diapositiva en los diagramas de arquitectura, 3) Cronometrar cada bloque con la herramienta de exposiciones.',
    authorName: 'Elena Ruiz',
    authorSemester: 'Semestre VII • Software',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    subject: 'Ingeniería de Software',
    tag: 'consejo',
    likesCount: 42,
    isLiked: false,
    commentsCount: 5,
    createdAt: Date.now() - 1000 * 60 * 60 * 28,
    comments: [],
  },
];

const TAG_CONFIG = {
  all: { label: 'Todos los temas', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200' },
  apunte: { label: 'Apuntes y PDFs', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  duda: { label: 'Dudas Académicas', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  consejo: { label: 'Consejos de Estudio', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  examen: { label: 'Exámenes & Repasos', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  general: { label: 'General', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
};

export const CommunityView: React.FC = () => {
  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_POSTS);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({ 'post-1': true });
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Formulario de nueva publicación
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newTag, setNewTag] = useState<'duda' | 'apunte' | 'consejo' | 'examen' | 'general'>('duda');

  const filteredPosts = posts.filter(post => {
    const matchesTag = selectedTag === 'all' || post.tag === selectedTag;
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  const handleToggleLike = (postId: string) => {
    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        const willLike = !p.isLiked;
        return {
          ...p,
          isLiked: willLike,
          likesCount: willLike ? p.likesCount + 1 : p.likesCount - 1,
        };
      })
    );
  };

  const handleToggleComments = (postId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleAddComment = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;

    const newComment: CommunityComment = {
      id: `comment-${Date.now()}`,
      authorName: 'Alejandro Valenzuela',
      authorRole: 'Estudiante',
      authorAvatar: STUDENT_AVATAR,
      content: commentText,
      createdAt: Date.now(),
      likesCount: 0,
    };

    setPosts(prev =>
      prev.map(p => {
        if (p.id !== postId) return p;
        return {
          ...p,
          commentsCount: p.commentsCount + 1,
          comments: [...p.comments, newComment],
        };
      })
    );

    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    setExpandedComments(prev => ({ ...prev, [postId]: true }));
  };

  const handleCreatePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const createdPost: CommunityPost = {
      id: `post-${Date.now()}`,
      title: newTitle.trim(),
      content: newContent.trim(),
      authorName: 'Alejandro Valenzuela',
      authorSemester: 'Semestre VI • Ingeniería',
      authorAvatar: STUDENT_AVATAR,
      subject: newSubject.trim() || 'General',
      tag: newTag,
      likesCount: 1,
      isLiked: true,
      commentsCount: 0,
      comments: [],
      createdAt: Date.now(),
    };

    setPosts([createdPost, ...posts]);
    setNewTitle('');
    setNewContent('');
    setNewSubject('');
    setIsCreatingPost(false);
  };

  const formatPostTime = (timestamp: number) => {
    const diffHours = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Hace unos minutos';
    if (diffHours === 1) return 'Hace 1 hora';
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-14 animate-in fade-in duration-300">
      {/* Encabezado formal de la Comunidad */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00236f]/10 dark:bg-[#00236f]/30 text-[#00236f] dark:text-[#90a8ff] text-xs font-bold mb-1.5">
            <MessageSquareQuote className="w-3.5 h-3.5 text-[#fe6b00]" />
            <span>Comunidad Estudiantil Dyser</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Foro Académico y Colaboración
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
            Comparte apuntes de materias, resuelve dudas de exámenes y colabora con compañeros de facultad.
          </p>
        </div>

        {/* Botón para publicar */}
        <button
          onClick={() => setIsCreatingPost(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold transition shadow-sm active:scale-95 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Publicación</span>
        </button>
      </section>

      {/* Modal / Formulario de Nueva Publicación */}
      {isCreatingPost && (
        <section className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111728] border-2 border-[#00236f]/40 dark:border-blue-500/40 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquareQuote className="w-4 h-4 text-[#fe6b00]" />
              Crear Nueva Publicación Académica
            </h3>
            <button
              onClick={() => setIsCreatingPost(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreatePostSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Título de la publicación
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Resumen del capítulo 4 de Termodinámica o Duda con el ejercicio 5"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-gray-50 dark:bg-[#090d16] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#00236f]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Materia o Asignatura
                </label>
                <input
                  type="text"
                  placeholder="Ej. Sistemas Distribuidos, Cálculo, Física..."
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-gray-50 dark:bg-[#090d16] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#00236f]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Categoría
                </label>
                <select
                  value={newTag}
                  onChange={e => setNewTag(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-gray-50 dark:bg-[#090d16] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#00236f]"
                >
                  <option value="duda">Duda Académica</option>
                  <option value="apunte">Compartir Apunte o PDF</option>
                  <option value="consejo">Consejo de Estudio</option>
                  <option value="examen">Examen o Repaso</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Contenido y Explicación
              </label>
              <textarea
                required
                rows={4}
                placeholder="Escribe el detalle de tu duda, comparte el resumen o describe los puntos clave para tus compañeros..."
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                className="w-full p-3 rounded-xl text-xs bg-gray-50 dark:bg-[#090d16] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#00236f]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreatingPost(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#00236f] hover:bg-[#1e3a8a] text-white text-xs font-bold transition shadow-sm"
              >
                Publicar en la Comunidad
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <section className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Chips de Categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          {Object.entries(TAG_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedTag(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedTag === key
                  ? 'bg-[#00236f] text-white shadow-xs'
                  : 'bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar tema, materia o apunte..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#00236f]"
          />
        </div>
      </section>

      {/* Lista de Publicaciones */}
      <section className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800">
            <HelpCircle className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              No se encontraron publicaciones
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Prueba con otros términos de búsqueda o sé el primero en compartir en esta categoría.
            </p>
          </div>
        ) : (
          filteredPosts.map(post => {
            const isCommentsOpen = !!expandedComments[post.id];
            const tagInfo = TAG_CONFIG[post.tag] || TAG_CONFIG.general;

            return (
              <article
                key={post.id}
                className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#111728] border border-gray-200/80 dark:border-gray-800 shadow-xs hover:border-gray-300 dark:hover:border-gray-700 transition space-y-4"
              >
                {/* Cabecera del Autor y Metadatos */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={post.authorAvatar || STUDENT_AVATAR}
                      alt={post.authorName}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-900 dark:text-white">
                          {post.authorName}
                        </span>
                        <span className="text-[10px] text-gray-400">• {formatPostTime(post.createdAt)}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {post.authorSemester || post.subject}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {post.subject}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${tagInfo.color}`}>
                      {tagInfo.label}
                    </span>
                  </div>
                </div>

                {/* Título y Contenido */}
                <div>
                  <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-2 leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>
                </div>

                {/* Archivo adjunto si existe */}
                {post.hasAttachment && post.attachmentName && (
                  <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/60 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#00236f] dark:text-blue-300">
                      <FileText className="w-4 h-4 text-[#fe6b00]" />
                      <span>{post.attachmentName}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-blue-900 text-blue-700 dark:text-blue-200 shadow-2xs">
                      Documento Verificado
                    </span>
                  </div>
                )}

                {/* Acciones de la Publicación */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Botón de Voto Útil / Like */}
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1.5 text-xs font-bold transition px-2.5 py-1.5 rounded-xl cursor-pointer ${
                        post.isLiked
                          ? 'bg-[#fe6b00]/10 text-[#fe6b00]'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${post.isLiked ? 'fill-[#fe6b00]' : ''}`} />
                      <span>{post.likesCount} útil</span>
                    </button>

                    {/* Botón de Comentarios */}
                    <button
                      onClick={() => handleToggleComments(post.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments.length} comentarios</span>
                    </button>
                  </div>

                  <span className="text-[10px] text-gray-400 hidden sm:inline">
                    Discusión verificada de facultad
                  </span>
                </div>

                {/* Sección Desplegable de Comentarios */}
                {isCommentsOpen && (
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3 animate-in fade-in duration-200">
                    {post.comments.length > 0 && (
                      <div className="space-y-2.5">
                        {post.comments.map(c => (
                          <div
                            key={c.id}
                            className="p-3 rounded-2xl bg-gray-50/80 dark:bg-[#0d1424] border border-gray-200/60 dark:border-gray-800/80 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 dark:text-white">
                                  {c.authorName}
                                </span>
                                {c.authorRole && (
                                  <span className="text-[9.5px] px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-[#00236f] dark:text-blue-300 font-semibold">
                                    {c.authorRole}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-gray-400">
                                {formatPostTime(c.createdAt)}
                              </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                              {c.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Input para agregar comentario */}
                    <form
                      onSubmit={e => handleAddComment(post.id, e)}
                      className="flex items-center gap-2 pt-1"
                    >
                      <input
                        type="text"
                        placeholder="Escribe tu aporte o respuesta académica..."
                        value={commentInputs[post.id] || ''}
                        onChange={e =>
                          setCommentInputs(prev => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-gray-50 dark:bg-[#070b14] border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#00236f]"
                      />
                      <button
                        type="submit"
                        disabled={!commentInputs[post.id]?.trim()}
                        className="p-2 rounded-xl bg-[#00236f] disabled:opacity-50 text-white hover:bg-[#1e3a8a] transition shrink-0 cursor-pointer"
                        title="Enviar respuesta"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};
