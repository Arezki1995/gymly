import { useMemo } from 'react';
import { getIllustration } from '../../content';
import type { Illustration, JointRef, Prop } from '../../content/schema';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion';
import {
  bodyPaths,
  buildTimeline,
  fmt,
  resolvePose,
  type BodyPart,
  type Resolved,
} from '../../lib/figure';

type Props = {
  exerciseId: string;
  /** Loop the movement. Ignored (still picture) when the user prefers reduced motion. */
  animate?: boolean;
  className?: string;
};

const PARTS: BodyPart[] = ['legF', 'armF', 'torso', 'shoulders', 'hips', 'legN', 'armN'];
const FAR: BodyPart[] = ['legF', 'armF'];

/** Drawing of an exercise from `illustrations.json`, or nothing if there isn't one. */
export function ExerciseIllustration({ exerciseId, animate = false, className = '' }: Props) {
  const ill = getIllustration(exerciseId);
  const reduced = usePrefersReducedMotion();
  if (!ill) return null;
  const moving = animate && !reduced && ill.frames.length > 1;
  return (
    <svg
      viewBox="0 0 200 140"
      className={`text-slate-700 dark:text-slate-200 ${className}`}
      role="img"
      aria-label={`Illustration: ${exerciseId.replace(/-/g, ' ')}`}
    >
      {moving ? <Animated ill={ill} /> : <Still ill={ill} />}
    </svg>
  );
}

function partClass(ill: Illustration, part: BodyPart): string {
  const highlighted = (ill.highlight as string[] | undefined)?.includes(part);
  const far = ill.view === 'side' && FAR.includes(part);
  return [
    highlighted ? 'stroke-brand-500' : 'stroke-current',
    far && !highlighted ? 'opacity-40' : '',
  ].join(' ');
}

const bodyStroke = {
  fill: 'none',
  strokeWidth: 4.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

function Body({ ill, r, ghost = false }: { ill: Illustration; r: Resolved; ghost?: boolean }) {
  const paths = bodyPaths(r);
  const visible = visibleParts(ill);
  return (
    <g opacity={ghost ? 0.18 : 1}>
      {PARTS.filter((p) => visible.has(p)).map((p) => (
        <path key={p} d={paths[p]} className={partClass(ill, p)} {...bodyStroke} />
      ))}
      <circle
        cx={fmt(r.points.head[0])}
        cy={fmt(r.points.head[1])}
        r={7}
        className="fill-current"
      />
    </g>
  );
}

/** Shoulder/hip lines only when the pose has width somewhere. */
function visibleParts(ill: Illustration): Set<BodyPart> {
  const s = new Set<BodyPart>(PARTS);
  if (!ill.frames.some((f) => (f.sw ?? 0) > 0)) s.delete('shoulders');
  if (!ill.frames.some((f) => (f.hw ?? 0) > 0)) s.delete('hips');
  return s;
}

function Still({ ill }: { ill: Illustration }) {
  const face = ill.face ?? 1;
  const solid = resolvePose(ill.frames[ill.staticFrame ?? ill.frames.length - 1]!, face);
  const ghostIndex = ill.ghostFrame ?? 0;
  const ghost =
    ill.frames.length > 1 && ghostIndex !== (ill.staticFrame ?? ill.frames.length - 1)
      ? resolvePose(ill.frames[ghostIndex]!, face)
      : undefined;
  return (
    <>
      <StaticProps props={ill.props} />
      {ghost && <Body ill={ill} r={ghost} ghost />}
      <AttachedProps props={ill.props} frames={[solid]} />
      <Body ill={ill} r={solid} />
    </>
  );
}

function Animated({ ill }: { ill: Illustration }) {
  const { frames, seconds } = useMemo(() => buildTimeline(ill), [ill]);
  const dur = `${seconds}s`;
  const paths = frames.map(bodyPaths);
  const visible = visibleParts(ill);
  const head = (i: 0 | 1) => frames.map((f) => fmt(f.points.head[i])).join(';');
  return (
    <>
      <StaticProps props={ill.props} />
      <AttachedProps props={ill.props} frames={frames} dur={dur} />
      {PARTS.filter((p) => visible.has(p)).map((p) => (
        <path key={p} d={paths[0]![p]} className={partClass(ill, p)} {...bodyStroke}>
          <animate
            attributeName="d"
            values={paths.map((x) => x[p]).join(';')}
            dur={dur}
            repeatCount="indefinite"
          />
        </path>
      ))}
      <circle
        cx={fmt(frames[0]!.points.head[0])}
        cy={fmt(frames[0]!.points.head[1])}
        r={7}
        className="fill-current"
      >
        <animate attributeName="cx" values={head(0)} dur={dur} repeatCount="indefinite" />
        <animate attributeName="cy" values={head(1)} dur={dur} repeatCount="indefinite" />
      </circle>
    </>
  );
}

const propStroke = 'stroke-slate-400 dark:stroke-slate-500';
const propFill = 'fill-slate-300 dark:fill-slate-700';

function StaticProps({ props }: { props: Prop[] }) {
  return (
    <g strokeLinecap="round">
      {props.map((p, i) => {
        switch (p.type) {
          case 'floor':
            return (
              <line
                key={i}
                x1={4}
                x2={196}
                y1={p.y + 2}
                y2={p.y + 2}
                className={propStroke}
                strokeWidth={2}
              />
            );
          case 'mat':
            return (
              <rect
                key={i}
                x={p.x1}
                y={p.y - 1}
                width={p.x2 - p.x1}
                height={3}
                rx={1.5}
                className={propFill}
              />
            );
          case 'matTop':
            return (
              <rect
                key={i}
                x={p.x}
                y={p.y}
                width={p.w}
                height={p.h}
                rx={4}
                className={`${propFill} opacity-60`}
              />
            );
          case 'panel':
            return (
              <rect
                key={i}
                x={p.x}
                y={p.y}
                width={p.w}
                height={p.h}
                rx={2}
                className={`${propFill} opacity-50`}
              />
            );
          case 'bench':
            return (
              <g key={i} className={propStroke} strokeWidth={2.5}>
                <rect
                  x={p.x}
                  y={p.y}
                  width={p.w}
                  height={5}
                  rx={2}
                  className={propFill}
                  strokeWidth={0}
                />
                <line x1={p.x + 6} x2={p.x + 6} y1={p.y + 5} y2={p.floor + 2} />
                <line x1={p.x + p.w - 6} x2={p.x + p.w - 6} y1={p.y + 5} y2={p.floor + 2} />
              </g>
            );
          case 'inclineBench': {
            const [x1, y1] = p.from;
            const [x2, y2] = p.to;
            return (
              <g key={i} className={propStroke} strokeWidth={2.5}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  strokeWidth={5}
                  className="stroke-slate-300 dark:stroke-slate-700"
                />
                <line
                  x1={x1 + (x2 - x1) * 0.15}
                  y1={y1 + (y2 - y1) * 0.15}
                  x2={x1 + (x2 - x1) * 0.15}
                  y2={p.floor + 2}
                />
                <line
                  x1={x1 + (x2 - x1) * 0.85}
                  y1={y1 + (y2 - y1) * 0.85}
                  x2={x1 + (x2 - x1) * 0.85}
                  y2={p.floor + 2}
                />
              </g>
            );
          }
          case 'wall':
            return (
              <rect key={i} x={p.x} y={4} width={6} height={p.floor - 2} className={propFill} />
            );
          case 'bar':
            return (
              <g key={i} className={propStroke}>
                <line x1={p.x1} x2={p.x2} y1={p.y} y2={p.y} strokeWidth={3} />
                <line x1={p.x1} x2={p.x1} y1={0} y2={p.y} strokeWidth={2} />
                <line x1={p.x2} x2={p.x2} y1={0} y2={p.y} strokeWidth={2} />
              </g>
            );
          case 'post':
            return (
              <line
                key={i}
                x1={p.x}
                x2={p.x}
                y1={p.y}
                y2={p.floor + 2}
                className={propStroke}
                strokeWidth={4}
              />
            );
          case 'roller':
            return (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={p.r}
                className={`${propFill} ${propStroke}`}
                strokeWidth={1.5}
              />
            );
          case 'cable':
            return (
              <g key={i}>
                <rect
                  x={p.x - 5}
                  y={6}
                  width={10}
                  height={p.floor - 4}
                  rx={2}
                  className={propFill}
                />
                <circle cx={p.x} cy={p.anchorY} r={3} className="fill-slate-500" />
              </g>
            );
          default:
            return null;
        }
      })}
    </g>
  );
}

/** Props that move with the body: cable lines, dumbbells and kettlebells. */
function AttachedProps({
  props,
  frames,
  dur,
}: {
  props: Prop[];
  frames: Resolved[];
  dur?: string;
}) {
  const at = (ref: JointRef) => frames.map((f) => f.points[ref]);
  const anim = (attr: string, values: string[]) =>
    dur && values.length > 1 ? (
      <animate attributeName={attr} values={values.join(';')} dur={dur} repeatCount="indefinite" />
    ) : null;
  return (
    <>
      {props.map((p, i) => {
        if (p.type === 'cable') {
          const ends = at(p.attach);
          const d = ends.map((e) => `M${p.x} ${p.anchorY}L${fmt(e[0])} ${fmt(e[1])}`);
          return (
            <path key={i} d={d[0]} className="stroke-slate-500" strokeWidth={1.5} fill="none">
              {anim('d', d)}
            </path>
          );
        }
        if (p.type === 'dumbbell' || p.type === 'kettlebell') {
          const pts = at(p.attach);
          const tr = pts.map((e) => `${fmt(e[0])} ${fmt(e[1])}`);
          return (
            <g key={i} transform={`translate(${tr[0]})`}>
              {dur && tr.length > 1 && (
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values={tr.join(';')}
                  dur={dur}
                  repeatCount="indefinite"
                />
              )}
              {p.type === 'dumbbell' ? (
                <g className="fill-slate-500">
                  <rect x={-7} y={-1} width={14} height={2} />
                  <rect x={-9} y={-4} width={4} height={8} rx={1} />
                  <rect x={5} y={-4} width={4} height={8} rx={1} />
                </g>
              ) : (
                <g>
                  <circle cx={0} cy={7} r={6} className="fill-slate-500" />
                  <path
                    d="M-3.5 3V-1h7v4"
                    className="stroke-slate-500"
                    strokeWidth={2}
                    fill="none"
                  />
                </g>
              )}
            </g>
          );
        }
        return null;
      })}
    </>
  );
}
