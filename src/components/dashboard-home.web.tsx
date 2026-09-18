import {
    Pressable,
    ScrollView,
    Text,
    useWindowDimensions,
    View,
    type ViewStyle,
} from 'react-native';

import { styles } from '@/styles/dashboard-home.styles.web';


type MetricCardProps = {
  title: string;
  value: string;
  description: string;
  icon: string;
  width: ViewStyle['width'];
};

type QuickActionProps = {
  title: string;
  description: string;
  icon: string;
  width: ViewStyle['width'];
};

const METRICS = [
  {
    title: 'Ventas de hoy',
    value: 'RD$ 0.00',
    description: 'Sin ventas registradas hoy',
    icon: '$',
  },
  {
    title: 'Productos registrados',
    value: '0',
    description: 'Catálogo vacío actualmente',
    icon: '□',
  },
  {
    title: 'Productos con stock bajo',
    value: '0',
    description: 'Sin alertas de inventario',
    icon: '△',
  },
  {
    title: 'Fiao pendiente',
    value: 'RD$ 0.00',
    description: 'Sin balances deudores registrados',
    icon: '▤',
  },
];

const QUICK_ACTIONS = [
  {
    title: 'Registrar venta',
    description: 'Cobrar productos',
    icon: '$',
  },
  {
    title: 'Agregar producto',
    description: 'Cargar inventario',
    icon: '＋',
  },
  {
    title: 'Crear pedido',
    description: 'Ordenar mercancía',
    icon: '▱',
  },
  {
    title: 'Registrar fiao',
    description: 'Libreta digital',
    icon: '▤',
  },
];

function MetricCard({
  title,
  value,
  description,
  icon,
  width,
}: MetricCardProps) {
  return (
    <View style={[styles.metricCard, { width }]}>
      <View style={styles.metricHeader}>
        <Text selectable style={styles.metricTitle}>
          {title}
        </Text>

        <View style={styles.metricIconContainer}>
          <Text style={styles.metricIcon}>{icon}</Text>
        </View>
      </View>

      <Text selectable style={styles.metricValue}>
        {value}
      </Text>

      <Text selectable style={styles.metricDescription}>
        {description}
      </Text>
    </View>
  );
}

function QuickAction({
  title,
  description,
  icon,
  width,
}: QuickActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: true }}
      disabled
      style={[styles.quickActionCard, { width }]}
    >
      <View style={styles.quickActionIconContainer}>
        <Text style={styles.quickActionIcon}>{icon}</Text>
      </View>

      <View style={styles.quickActionInformation}>
        <Text selectable numberOfLines={1} style={styles.quickActionTitle}>
          {title}
        </Text>

        <Text
          selectable
          numberOfLines={1}
          style={styles.quickActionDescription}
        >
          {description}
        </Text>
      </View>

      <View style={styles.soonBadge}>
        <Text style={styles.soonText}>Próximamente</Text>
      </View>
    </Pressable>
  );
}

export default function DashboardHome() {
  const { width } = useWindowDimensions();

  const narrow = width < 760;
  const medium = width < 1250;

  const metricWidth: ViewStyle['width'] = narrow
    ? '100%'
    : medium
      ? '48.5%'
      : '23.5%';

  const actionWidth: ViewStyle['width'] = narrow
    ? '100%'
    : medium
      ? '48.5%'
      : '23.5%';

  const date = new Intl.DateTimeFormat('es-DO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const formattedDate = date.charAt(0).toUpperCase() + date.slice(1);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator
      style={styles.scrollView}
      contentContainerStyle={[
        styles.content,
        narrow && styles.contentNarrow,
      ]}
    >
      <View
        style={[
          styles.pageHeader,
          narrow && styles.pageHeaderNarrow,
        ]}
      >
        <View style={styles.titleArea}>
          <Text selectable style={styles.pageTitle}>
            Buenos días
          </Text>

          <Text selectable style={styles.pageSubtitle}>
            Aquí tienes un resumen de tu negocio
          </Text>
        </View>

        <View
          style={[
            styles.headerControls,
            narrow && styles.headerControlsNarrow,
          ]}
        >
          <View style={styles.dateCard}>
            <Text style={styles.dateIcon}>□</Text>

            <Text selectable numberOfLines={1} style={styles.dateText}>
              {formattedDate}
            </Text>
          </View>

          <Pressable
            accessibilityLabel="Ver notificaciones"
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.notificationButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.notificationIcon}>♧</Text>
            <View style={styles.notificationDot} />
          </Pressable>
        </View>
      </View>

      <View style={styles.headerDivider} />

      <View style={styles.phaseBanner}>
        <View style={styles.phaseIconContainer}>
          <Text style={styles.phaseIcon}>›_</Text>
        </View>

        <View style={styles.phaseInformation}>
          <Text selectable style={styles.phaseTitle}>
            Sistema listo para apertura contable
          </Text>

          <Text selectable style={styles.phaseDescription}>
            Sprint 0 inicializado sin transacciones previas. La interfaz está
            preparada para recibir los datos del negocio.
          </Text>
        </View>

        <View style={styles.phaseBadge}>
          <Text style={styles.phaseBadgeText}>FASE 0.1</Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        {METRICS.map((metric) => (
          <MetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            description={metric.description}
            icon={metric.icon}
            width={metricWidth}
          />
        ))}
      </View>

      <View style={styles.sectionHeading}>
        <Text selectable style={styles.sectionTitle}>
          Acciones rápidas
        </Text>

        <Text selectable style={styles.sectionSubtitle}>
          Accesos directos a operaciones frecuentes
        </Text>
      </View>

      <View style={styles.quickActionsGrid}>
        {QUICK_ACTIONS.map((action) => (
          <QuickAction
            key={action.title}
            title={action.title}
            description={action.description}
            icon={action.icon}
            width={actionWidth}
          />
        ))}
      </View>

      <View
        style={[
          styles.bottomGrid,
          narrow && styles.bottomGridNarrow,
        ]}
      >
        <View
          style={[
            styles.activityCard,
            narrow && styles.fullWidthCard,
          ]}
        >
          <View style={styles.cardHeading}>
            <View style={styles.cardHeadingTitle}>
              <Text selectable style={styles.cardTitle}>
                Actividad reciente
              </Text>

              <View style={styles.eventBadge}>
                <Text style={styles.eventBadgeText}>0 eventos</Text>
              </View>
            </View>

            <Text style={styles.historyText}>Ver historial →</Text>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.emptyActivity}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>◷</Text>
            </View>

            <Text selectable style={styles.emptyTitle}>
              Todavía no hay actividad registrada
            </Text>

            <Text selectable style={styles.emptyDescription}>
              Las ventas, pedidos y movimientos aparecerán aquí cuando
              comiencen las operaciones del negocio.
            </Text>
          </View>

          <View style={styles.activityFooter}>
            <Text selectable style={styles.activityFooterText}>
              ⌛ Esperando primera operación
            </Text>

            <Text selectable style={styles.activityFooterText}>
              Sin actividad reciente
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusCard,
            narrow && styles.fullWidthCard,
          ]}
        >
          <Text selectable style={styles.cardTitle}>
            Estado general
          </Text>

          <Text selectable style={styles.statusSubtitle}>
            Diagnóstico de conexión del sistema
          </Text>

          <View style={styles.cardDivider} />

          <View style={styles.statusRow}>
            <View style={styles.statusDotGreen} />

            <View style={styles.statusInformation}>
              <Text selectable style={styles.statusTitle}>
                Interfaz cargada
              </Text>

              <Text selectable style={styles.statusDescription}>
                Panel web funcionando correctamente
              </Text>
            </View>

            <View style={styles.successBadge}>
              <Text style={styles.successBadgeText}>Disponible</Text>
            </View>
          </View>

          <View style={styles.statusDivider} />

          <View style={styles.statusRow}>
            <View style={styles.statusDotPending} />

            <View style={styles.statusInformation}>
              <Text selectable style={styles.statusTitle}>
                Integración con API
              </Text>

              <Text selectable style={styles.statusDescription}>
                Pendiente de conexión con el backend
              </Text>
            </View>

            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>Pendiente</Text>
            </View>
          </View>

          <View style={styles.statusDivider} />

          <View style={styles.statusRow}>
            <Text style={styles.updateIcon}>↻</Text>

            <View style={styles.statusInformation}>
              <Text selectable style={styles.statusTitle}>
                Última actualización
              </Text>

              <Text selectable style={styles.statusDescription}>
                Información temporal del frontend
              </Text>
            </View>

            <Text selectable style={styles.updateValue}>
              Ahora
            </Text>
          </View>

          <View style={styles.businessCard}>
            <Text style={styles.businessIcon}>▱</Text>

            <View style={styles.businessInformation}>
              <Text selectable style={styles.businessTitle}>
                Negocio sin sincronizar
              </Text>

              <Text selectable style={styles.businessDescription}>
                La información comercial se mostrará cuando el backend envíe
                los datos del usuario autenticado.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

