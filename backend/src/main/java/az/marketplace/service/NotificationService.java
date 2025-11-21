package az.marketplace.service;

import az.marketplace.dto.notification.NotificationResponse;
import az.marketplace.entity.Notification;
import az.marketplace.entity.Order;
import az.marketplace.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getAll() {
        return notificationRepository.findAllByOrderByIsReadAscCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long id) {
        notificationRepository.findById(id).ifPresent(notification -> {
            if (!notification.isRead()) {
                notification.setRead(true);
                notificationRepository.save(notification);
            }
        });
    }

    @Transactional
    public void markAllAsRead() {
        List<Notification> list = notificationRepository.findAll();
        boolean changed = false;
        for (Notification n : list) {
            if (!n.isRead()) {
                n.setRead(true);
                changed = true;
            }
        }
        if (changed) {
            notificationRepository.saveAll(list);
        }
    }

    @Transactional
    public NotificationResponse notifyOrderCreated(Order order) {
        String productName = order.getProduct() != null ? order.getProduct().getName() : "an item";
        String message = String.format("New order #%d created for %s", order.getId(), productName);

        Notification notification = Notification.builder()
                .message(message)
                .order(order)
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        NotificationResponse response = toResponse(notification);
        broadcast(response);
        return response;
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .message(n.getMessage())
                .createdAt(n.getCreatedAt())
                .read(n.isRead())
                .orderId(n.getOrder() != null ? n.getOrder().getId() : null)
                .build();
    }

    private void broadcast(NotificationResponse payload) {
        messagingTemplate.convertAndSend("/topic/notifications", payload);
    }
}
