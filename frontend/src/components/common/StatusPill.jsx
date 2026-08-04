import { formatDomainLabel, getStatusTone } from '../../constants/domainEnums.js';
import Badge from './Badge.jsx';

export default function StatusPill({ status, tone, className = '' }) {
  return <Badge variant={tone || getStatusTone(status)} className={`capitalize ${className}`}>{formatDomainLabel(status)}</Badge>;
}
